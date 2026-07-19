// Compiles sections/data/sections.js into routes.yaml and section partials
// (category link, parent subnav switcher, per-desk subnav).
//
// Merge model:
//   routes-default.yaml + generated channels/collections → routes.yaml
// Handwritten entries come first. redirects.yaml is handwritten and not
// generated here.

import YAML from 'yaml';
import { sections } from './data/sections.js';

// Default path if article has no valid primary tag
const CATCH_ALL_PATH = '/article/';

const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TAG_SLUG_LENGTH = 191;

const ROUTES_HEADER =
  '# GENERATED FILE. Do not edit by hand.\n' +
  '# Built from routes-default.yaml + sections/data/sections.js by sections/build.js\n' +
  '# (run `gulp sections` or `gulp build`). Edit those sources instead.\n';

/** Return whether a section node has no child sections. */
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
      tagSlug: node.tagSlug,
      ids,
      path: `/${ids.join('/')}/`,
      expectedSlug: `sec_${ids.join('_')}`,
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

/** Get a list of a tag slug and all its descendant tag slugs */
function selfAndDescendantTags(node) {
  const tags = [node.tagSlug];
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
    if (typeof node.label !== 'string' || node.label.trim() === '') {
      throw new Error(`[sections] Section ${node.path} must have a non-empty label.`);
    }
    if (typeof node.tagSlug !== 'string' || node.tagSlug.trim() === '') {
      throw new Error(`[sections] Section ${node.path} must have a non-empty tagSlug.`);
    }
    if (node.tagSlug.length > MAX_TAG_SLUG_LENGTH) {
      throw new Error(
        `[sections] tagSlug "${node.tagSlug}" for ${node.path} is ${node.tagSlug.length} ` +
        `characters; Ghost allows at most ${MAX_TAG_SLUG_LENGTH}.`
      );
    }

    for (const segment of node.ids) {
      if (typeof segment !== 'string' || !SLUG_SEGMENT.test(segment)) {
        throw new Error(
          `[sections] Invalid id segment "${segment}" in ${node.path} — use lowercase letters, numbers, and hyphens.`
        );
      }
    }

    if (node.tagSlug.toLowerCase() !== node.expectedSlug.toLowerCase()) {
      throw new Error(
        `[sections] tagSlug "${node.tagSlug}" for ${node.path} must be "${node.expectedSlug}" ` +
        `(ancestry: ${node.ids.join(' > ')}). Use underscores only between ` +
        'ancestry levels and preserve hyphens inside section ids.'
      );
    }

    const slugKey = node.tagSlug.toLowerCase();
    if (seenSlugs.has(slugKey)) {
      throw new Error(`[sections] Duplicate tagSlug "${node.tagSlug}".`);
    }
    seenSlugs.add(slugKey);

    if (seenPaths.has(node.path)) {
      throw new Error(`[sections] Duplicate section path "${node.path}".`);
    }
    seenPaths.add(node.path);
  }

  return nodes;
}

// --- routes.yaml objects ----------------------------------------------------

/** Build the Ghost channel configuration for a non-leaf section. */
function channelEntry(node) {
  const tags = selfAndDescendantTags(node.raw);
  return {
    controller: 'channel',
    filter: `primary_tag:[${tags.join(',')}]`,
    template: 'section-parent',
    data: `tag.${node.tagSlug}`,
  };
}

/** Build the Ghost collection configuration that owns a section's posts. */
function collectionEntry(node) {
  return {
    permalink: `${node.path}{slug}/`,
    filter: `primary_tag:${node.tagSlug}`,
    template: 'section',
    data: `tag.${node.tagSlug}`,
  };
}

/** Build the fallback collection for posts without a configured section tag. */
function catchAllCollectionEntry(nodes) {
  const allTags = nodes.map((node) => node.tagSlug).join(',');
  return {
    permalink: `${CATCH_ALL_PATH}{slug}/`,
    filter: `primary_tag:-[${allTags}]`,
    template: 'index',
  };
}

/** Build the generated routes map for every non-leaf section channel. */
function generatedRoutes(nodes) {
  const routes = {};
  for (const node of nodes.filter((entry) => !entry.leaf)) {
    routes[node.path] = channelEntry(node);
  }
  return routes;
}

/** Build the generated collections map for all sections and fallback posts. */
function generatedCollections(nodes) {
  const collections = {};
  for (const node of nodes) {
    // Leaves own their public path; non-leaves use a hidden /_/… path so the
    // public path can remain a rollup channel.
    const key = node.leaf ? node.path : `/_${node.path}`;
    collections[key] = collectionEntry(node);
  }
  collections[CATCH_ALL_PATH] = catchAllCollectionEntry(nodes);
  return collections;
}

/** Return a mapping value as an object, or an empty object for invalid values. */
function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/**
 * Merge generated section routes into the handwritten defaults and serialize
 * the complete Ghost routes configuration as YAML.
 */
export function renderRoutesYaml(routesDefault, tree = sections) {
  const nodes = validateSections(tree);
  const defaults = YAML.parse(routesDefault) || {};

  if (!Object.hasOwn(defaults, 'routes')) {
    throw new Error('[sections] routes-default.yaml must contain a routes: block.');
  }
  if (!Object.hasOwn(defaults, 'collections')) {
    throw new Error('[sections] routes-default.yaml must contain a collections: block.');
  }

  const doc = {
    routes: {
      ...asObject(defaults.routes),
      ...generatedRoutes(nodes),
    },
    collections: {
      ...asObject(defaults.collections),
      ...generatedCollections(nodes),
    },
  };

  if (Object.hasOwn(defaults, 'taxonomies')) {
    doc.taxonomies = asObject(defaults.taxonomies);
  }

  return (
    ROUTES_HEADER +
    YAML.stringify(doc, {
      lineWidth: 0,
      defaultKeyType: 'PLAIN',
      defaultStringType: 'PLAIN',
    })
  );
}

// --- generated partials -----------------------------------------------------

/** Render the partial that maps each primary section tag to its public path. */
export function renderCategoryLinkPartial(tree = sections) {
  const nodes = validateSections(tree);

  let body = '{{#primary_tag}}\n';
  nodes.forEach((node, index) => {
    const keyword = index === 0 ? '#match' : 'else match';
    body += `  {{${keyword} slug '${node.tagSlug}'}}\n`;
    body += `    <a href='${node.path}'>{{name}}</a>\n`;
  });
  body += '  {{else}}\n';
  body += '    <span>{{name}}</span>\n';
  body += '  {{/match}}\n';
  body += '{{/primary_tag}}\n';

  return `{{!-- Category link — generated from sections/data/sections.js --}}\n${body}`;
}

/** Render selected homepage sections with filters that include descendants. */
function renderHomeSectionDispatcher(nodes) {
  const matches = nodes.map((node, index) => {
    const keyword = index === 0 ? '#match' : 'else match';
    const tags = selfAndDescendantTags(node.raw).join(',');
    return [
      `  {{${keyword} this '${node.tagSlug}'}}`,
      '    {{> tag-section',
      `      sectionSlug='${node.tagSlug}'`,
      `      sectionName="${node.label.replaceAll('"', '&quot;')}"`,
      `      sectionUrl='${node.path}'`,
      `      postFilter='primary_tag:[${tags}]'`,
      '    }}',
    ].join('\n');
  });

  return [
    '{{!-- Homepage section dispatcher — generated from sections/data/sections.js --}}',
    ...matches,
    '  {{/match}}',
    '',
  ].join('\n');
}

/** Render the dispatcher partial that selects a non-leaf section's subnav. */
function renderParentSubnavSwitcher(nonLeafNodes) {
  const matches = nonLeafNodes.map((node, index) => {
    const keyword = index === 0 ? '#match' : 'else match';
    return `  {{${keyword} slug '${node.tagSlug}'}}\n    {{> sections/dist/${node.tagSlug}-subnav }}`;
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

/** Render the direct-child navigation partial for one non-leaf section. */
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
    `{{!-- ${node.tagSlug} subnav — generated from sections/data/sections.js --}}`,
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
    { file: 'home-section.hbs', content: renderHomeSectionDispatcher(nodes) },
    { file: 'parent-subnav.hbs', content: renderParentSubnavSwitcher(nonLeaf) },
  ];

  for (const node of nonLeaf) {
    partials.push({ file: `${node.tagSlug}-subnav.hbs`, content: renderSectionSubnav(node) });
  }

  return partials;
}
