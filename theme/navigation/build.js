// Compiles navigation/data/header.js into static HTML for the header partial.

// Escape user-facing strings before embedding them in HTML attributes/text.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render one nav item as a <li>, recursing into item.children for submenus.
function renderNavItem(item, depth) {
  var has_children = item.children && item.children.length > 0,
  // Top-level items get --primary; nested items get --child and a depth suffix.
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
      html += renderNavItem(child, depth + 1);
    });

    html += '</ul>';
  }

  html += '</li>';

  return html;
}

// Turn the full nav tree into a string of <li> elements for the generated partial.
// Output is plain HTML (not Handlebars {{#foreach}}) so the nav is fixed at build time.
export function renderPrimaryNavigation(items) {
  var html = '{{!-- AUTO-GENERATED from navigation/data/header.js. Do not edit. --}}\n';

  items.forEach(function(item) {
    html += renderNavItem(item, 0);
    html += '\n';
  });

  return html;
}
