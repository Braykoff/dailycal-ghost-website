// Compiles navigation/data/header.js and navigation/data/footer.js into static
// HTML for the header and footer navigation partials.

// Escape user-facing strings before embedding them in HTML attributes/text.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render one header nav item as a <li>, recursing into item.children for submenus.
function renderHeaderNavItem(item, depth) {
  var has_children = item.children && item.children.length > 0,
  // Top-level header items use --primary; nested items get --child and a depth suffix.
    depth_class = depth === 0
      ? 'c-nav__item--primary'
      : 'c-nav__item--child c-nav__item--depth-' + depth,
    has_children_class = has_children ? ' c-nav__item--has-children' : '',
    label = escapeHtml(item.label),
    url = escapeHtml(item.url),
    html = '';

  html += '<li class=\'c-nav__item ' + depth_class + has_children_class + '\'>';

  // Parent links remain real <a> tags so tapping the label navigates on mobile
  // and desktop. Dropdown state is handled separately by app.js on .js-nav-toggle.
  html += '<a href=\'' + url + '\' class=\'c-nav__link\'';

  if (has_children) {
    html += ' aria-haspopup=\'true\' aria-expanded=\'false\'';
  }

  html += '>' + label + '</a>';

  if (has_children) {
    // Toggle button opens/closes the submenu without blocking navigation on the link.
    html += '<button type=\'button\' class=\'c-nav__toggle js-nav-toggle\' aria-expanded=\'false\' aria-label=\'Toggle ' + label + ' submenu\'>';
    html += '<span class=\'u-screenreader\'>Open submenu</span></button>';

    // Submenu <ul> depth matches the child items inside (depth + 1).
    html += '<ul class=\'c-nav__submenu c-nav__submenu--depth-' + (depth + 1) + ' u-plain-list\'>';

    item.children.forEach(function(child) {
      html += renderHeaderNavItem(child, depth + 1);
    });

    html += '</ul>';
  }

  html += '</li>';

  return html;
}

// Turn the header nav tree into <li> elements for partials/navigation/dist/header.hbs.
export function renderHeaderNavigation(items) {
  var html = '{{!-- AUTO-GENERATED header navigation from navigation/data/header.js. Do not edit. --}}\n';

  items.forEach(function(item) {
    html += renderHeaderNavItem(item, 0);
    html += '\n';
  });

  return html;
}

// --- Footer navigation ---

// Footer sections may have children, but those children must be leaf links.
function validateFooterNavigation(items, groupLabel) {
  items.forEach(function(item) {
    if (!item.children || item.children.length === 0) {
      return;
    }

    item.children.forEach(function(child) {
      if (child.children && child.children.length > 0) {
        throw new Error(
          'Footer navigation in navigation/data/footer.js (' + groupLabel + ') ' +
          'does not support nesting deeper than children. ' +
          'Found grandchildren under "' + item.label + '" → "' + child.label + '".'
        );
      }
    });
  });
}

// Render one footer section: bold title link with optional child links stacked below.
function renderFooterSection(item) {
  var label = escapeHtml(item.label),
    url = escapeHtml(item.url),
    has_children = item.children && item.children.length > 0,
    html = '';

  html += '<div class=\'c-footer-nav-section\'>';

  // Section title is always a link, even when child links exist below it.
  html += '<a href=\'' + url + '\' class=\'c-footer-nav-section__title\'>' + label + '</a>';

  if (has_children) {
    html += '<ul class=\'c-footer-nav-section__links u-plain-list\'>';

    item.children.forEach(function(child) {
      html += '<li class=\'c-footer-nav-section__item\'>';
      html += '<a href=\'' + escapeHtml(child.url) + '\' class=\'c-footer-nav-section__link\'>';
      html += escapeHtml(child.label);
      html += '</a></li>';
    });

    html += '</ul>';
  }

  html += '</div>';

  return html;
}

// Stack utility footer sections in the rightmost column (Advertise, Classifieds, etc.).
function renderUtilityFooterColumn(items) {
  var html = '<div class=\'c-footer-nav-grid__utility\'>';

  items.forEach(function(item) {
    html += renderFooterSection(item);
  });

  html += '</div>';

  return html;
}

// Split siteNavigation into rows of siteSectionsPerRow, preserving footer.js order.
function chunkSiteNavigation(items, sectionsPerRow) {
  var rows = [],
    index = 0;

  while (index < items.length) {
    rows.push(items.slice(index, index + sectionsPerRow));
    index += sectionsPerRow;
  }

  return rows;
}

// Lay out site sections left-to-right, wrapping to a new row every siteSectionsPerRow items.
function renderSiteFooterNavigation(siteNavigation, siteSectionsPerRow) {
  var rows = chunkSiteNavigation(siteNavigation, siteSectionsPerRow),
    html = '<div class=\'c-footer-nav-grid__site\' style=\'--site-sections-per-row: ' + siteSectionsPerRow + '\'>';

  rows.forEach(function(row) {
    html += '<div class=\'c-footer-nav-grid__row\'>';

    row.forEach(function(item) {
      html += '<div class=\'c-footer-nav-grid__cell\'>';
      html += renderFooterSection(item);
      html += '</div>';
    });

    html += '</div>';
  });

  html += '</div>';

  return html;
}

// Turn footer nav data into the grid for partials/navigation/dist/footer.hbs.
// Layout comes from footer.js order and siteSectionsPerRow; utility nav is always
// the rightmost column and stays visible on mobile.
export function renderFooterNavigation(siteNavigation, utilityNavigation, siteSectionsPerRow) {
  validateFooterNavigation(siteNavigation, 'siteNavigation');
  validateFooterNavigation(utilityNavigation, 'utilityNavigation');

  var html = '{{!-- AUTO-GENERATED footer navigation from navigation/data/footer.js. Do not edit. --}}\n';

  html += '<nav class=\'c-footer-nav-grid\' aria-label=\'Footer navigation\'>';
  html += renderSiteFooterNavigation(siteNavigation, siteSectionsPerRow);
  html += renderUtilityFooterColumn(utilityNavigation);
  html += '</nav>';

  return html;
}
