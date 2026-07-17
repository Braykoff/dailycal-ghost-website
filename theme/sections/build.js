// Compiles sections/data/sections.js into routes.yaml, redirects.yaml, and
// the section partials (category link, parent subnav switcher, per-desk subnav).
//
// Merge model:
//   routes-default.yaml    + generated channels/collections  → routes.yaml
//   redirects-default.yaml + generated redirects             → redirects.yaml
// Handwritten entries come first; generated entries are injected at markers.

import { sections } from './data/sections.js';

const ROUTES_MARKER = '# @@GENERATED_ROUTES@@';
const COLLECTIONS_MARKER = '# @@GENERATED_COLLECTIONS@@';
const REDIRECTS_MARKER = '# @@GENERATED_REDIRECTS@@';

const CATCH_ALL_PATH = '/article/';

const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ROUTES_HEADER =
  '# GENERATED FILE — do not edit by hand.\n' +
  '# Built from routes-default.yaml + sections/data/sections.js by sections/build.js\n' +
  '# (run `gulp sections` or `gulp build`). Edit those sources instead.\n';

const REDIRECTS_HEADER =
  '# GENERATED FILE — do not edit by hand.\n' +
  '# Built from redirects-default.yaml + sections/data/sections.js by sections/build.js\n' +
  '# (run `gulp sections` or `gulp build`). Edit those sources instead.\n';

function indent(level, line) {
  return `${'  '.repeat(level)}${line}`;
}

function isLeaf(node) {
  return !node.children || node.children.length === 0;
}

/**
 * Depth-first walk that enriches every node with derived ancestry data:
 * ids (path segments), path, expected slug, and leaf flag.
 */
export function flatten(tree = sections, ancestorIds = []) {
  const out = [];

  for (const node of tree) {
    const ids = [...ancestorIds, node.id];
    const enriched = {
      raw: node,
      id: node.id,
      label: node.label,
      tag: node.tag,
      ids,
      path: `/${ids.join('/')}/`,
      expectedSlug: `sec-${ids.join('-')}`,
      leaf: isLeaf(node),
      children: node.children || [],
    };
    out.push(enriched);
    if (!enriched.leaf) {
      out.push(...flatten(node.children, ids));
    }
  }

  return out;
}

function selfAndDescendantTags(node) {
  const tags = [node.tag];
  for (const child of node.children || []) {
    tags.push(...selfAndDescendantTags(child));
  }
  return tags;
}

/** Throws if any tag slug does not match its ancestry, or ids/paths collide. */
export function validateSections(tree = sections) {
  const nodes = flatten(tree);
  const seenSlugs = new Set();
  const seenPaths = new Set();

  for (const node of nodes) {
    for (const segment of node.ids) {
      if (!SLUG_SEGMENT.test(segment)) {
        throw new Error(
          `[sections] Invalid id segment "${segment}" in ${node.path} — use lowercase letters, numbers, and hyphens.`
        );
      }
    }

    if (node.tag.toLowerCase() !== node.expectedSlug.toLowerCase()) {
      throw new Error(
        `[sections] Tag slug "${node.tag}" for ${node.path} must be "${node.expectedSlug}" ` +
        `(ancestry: ${node.ids.join(' > ')}).`
      );
    }

    const slugKey = node.tag.toLowerCase();
    if (seenSlugs.has(slugKey)) {
      throw new Error(`[sections] Duplicate tag slug "${node.tag}".`);
    }
    seenSlugs.add(slugKey);

    if (seenPaths.has(node.path)) {
      throw new Error(`[sections] Duplicate section path "${node.path}".`);
    }
    seenPaths.add(node.path);
  }

  return nodes;
}

// --- routes.yaml blocks -----------------------------------------------------

// Non-leaf desk: a channel that rolls up the desk + every descendant primary tag.
function channelBlock(node) {
  const tags = selfAndDescendantTags(node.raw);
  return [
    indent(1, `${node.path}:`),
    indent(2, 'controller: channel'),
    indent(2, `filter: primary_tag:[${tags.join(',')}]`),
    indent(2, 'template: section-parent'),
    indent(2, `data: tag.${node.tag}`),
  ].join('\n');
}

// Leaf: a collection that owns its posts' permalinks and its own index page.
function leafCollectionBlock(node) {
  return [
    indent(1, `${node.path}:`),
    indent(2, `permalink: ${node.path}{slug}/`),
    indent(2, `filter: primary_tag:${node.tag}`),
    indent(2, 'template: section'),
    indent(2, `data: tag.${node.tag}`),
  ].join('\n');
}

// Non-leaf: its own posts still need permalinks at /a/b/{slug}/, but /a/b/ is
// the channel index — so own the permalinks from a hidden /_/a/b/ collection.
function parentPermalinkCollectionBlock(node) {
  return [
    indent(1, `/_${node.path}:`),
    indent(2, `permalink: ${node.path}{slug}/`),
    indent(2, `filter: primary_tag:${node.tag}`),
    indent(2, 'template: section'),
    indent(2, `data: tag.${node.tag}`),
  ].join('\n');
}

// Catch-all for posts with no section tag: /article/{slug}/. Excludes every
// section tag so section posts never fall through to it. Must be listed last.
function catchAllCollectionBlock(nodes) {
  const allTags = nodes.map((node) => node.tag).join(',');
  return [
    indent(1, `${CATCH_ALL_PATH}:`),
    indent(2, `permalink: ${CATCH_ALL_PATH}{slug}/`),
    indent(2, `filter: primary_tag:-[${allTags}]`),
    indent(2, 'template: index'),
  ].join('\n');
}

function generatedRoutesBlock(nodes) {
  return nodes
    .filter((node) => !node.leaf)
    .map(channelBlock)
    .join('\n');
}

function generatedCollectionsBlock(nodes) {
  const blocks = nodes.map((node) =>
    node.leaf ? leafCollectionBlock(node) : parentPermalinkCollectionBlock(node)
  );
  blocks.push(catchAllCollectionBlock(nodes));
  return blocks.join('\n');
}

// --- redirects.yaml blocks --------------------------------------------------

function generatedRedirectsBlock(nodes) {
  const lines = [];

  // Unwrap the hidden /_/… collection indexes to their public paths (any depth).
  lines.push(indent(1, '^/_/(.*?)/?$: /$1/'));

  // Section tag archives → section pages. Explicit per section because segment
  // ids may contain hyphens, so slug→path boundaries can't be recovered by a
  // generic regex.
  for (const node of nodes) {
    lines.push(indent(1, `^/tag/${node.tag}/?$: ${node.path}`));
  }

  return lines.join('\n');
}

// --- merge helpers ----------------------------------------------------------

function stripComments(text) {
  return (
    text
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .trimEnd() + '\n'
  );
}

// Use a replacer function so `$1`/`$&` in generated content are treated as
// literals rather than regex substitution tokens.
function injectMarker(text, marker, block) {
  return text.replace(marker, () => block);
}

export function renderRoutesYaml(routesDefault, tree = sections) {
  const nodes = validateSections(tree);
  let merged = injectMarker(routesDefault, ROUTES_MARKER, generatedRoutesBlock(nodes));
  merged = injectMarker(merged, COLLECTIONS_MARKER, generatedCollectionsBlock(nodes));
  return ROUTES_HEADER + stripComments(merged);
}

export function renderRedirectsYaml(redirectsDefault, tree = sections) {
  const nodes = validateSections(tree);
  const merged = injectMarker(redirectsDefault, REDIRECTS_MARKER, generatedRedirectsBlock(nodes));
  return REDIRECTS_HEADER + stripComments(merged);
}

// --- generated partials -----------------------------------------------------

export function renderCategoryLinkPartial(tree = sections) {
  const nodes = validateSections(tree);

  let body = '{{#primary_tag}}\n';
  nodes.forEach((node, index) => {
    const keyword = index === 0 ? '#match' : 'else match';
    body += `  {{${keyword} slug '${node.tag}'}}\n`;
    body += `    <a href='${node.path}'>{{name}}</a>\n`;
  });
  body += '  {{else}}\n';
  body += "    <a href='{{url}}'>{{name}}</a>\n";
  body += '  {{/match}}\n';
  body += '{{/primary_tag}}\n';

  return `{{!-- Category link — generated from sections/data/sections.js --}}\n${body}`;
}

function renderParentSubnavSwitcher(nonLeafNodes) {
  const matches = nonLeafNodes.map((node, index) => {
    const keyword = index === 0 ? '#match' : 'else match';
    return `  {{${keyword} slug '${node.tag}'}}\n    {{> sections/dist/${node.tag}-subnav }}`;
  });

  const inner = matches.length
    ? [...matches, '  {{/match}}']
    : ['  {{!-- no parent sections --}}'];

  return [
    '{{!-- Parent subnav switcher — generated from sections/data/sections.js --}}',
    '{{#tag}}',
    ...inner,
    '{{/tag}}',
    '',
  ].join('\n');
}

function renderSectionSubnav(node) {
  const links = node.children.map((child) => {
    const childPath = `${node.path}${child.id}/`;
    return [
      `  <a class='c-section-subnav__link' href='${childPath}'>`,
      `    ${child.label}`,
      '  </a>',
    ].join('\n');
  });

  return [
    `{{!-- ${node.tag} subnav — generated from sections/data/sections.js --}}`,
    `<nav class='c-section-subnav' aria-label='${node.label} sections'>`,
    ...links,
    '</nav>',
    '',
  ].join('\n');
}

/**
 * Returns every generated partial as { file, content } so the caller writes
 * them (keeps this module free of filesystem side effects).
 */
export function sectionPartials(tree = sections) {
  const nodes = validateSections(tree);
  const nonLeaf = nodes.filter((node) => !node.leaf);

  const partials = [
    { file: 'category-link.hbs', content: renderCategoryLinkPartial(tree) },
    { file: 'parent-subnav.hbs', content: renderParentSubnavSwitcher(nonLeaf) },
  ];

  for (const node of nonLeaf) {
    partials.push({ file: `${node.tag}-subnav.hbs`, content: renderSectionSubnav(node) });
  }

  return partials;
}
