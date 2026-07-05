// Builds navigation data into Ghost Handlebars partials at compile time.

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Recursively renders one nav item and its submenu (up to grandchildren).
function renderNavItem(item, depth) {
  var has_children = item.children && item.children.length > 0,
    depth_class = depth === 0
      ? 'c-nav__item--primary'
      : 'c-nav__item--child c-nav__item--depth-' + depth,
    has_children_class = has_children ? ' c-nav__item--has-children' : '',
    label = escapeHtml(item.label),
    url = escapeHtml(item.url),
    html = '';

  html += '<li class=\'c-nav__item ' + depth_class + has_children_class + '\'>';
  html += '<a href=\'' + url + '\' class=\'c-nav__link\'';

  if (has_children) {
    html += ' aria-haspopup=\'true\' aria-expanded=\'false\'';
  }

  html += '>' + label + '</a>';

  if (has_children) {
    html += '<button type=\'button\' class=\'c-nav__toggle js-nav-toggle\' aria-expanded=\'false\' aria-label=\'Toggle ' + label + ' submenu\'>';
    html += '<span class=\'u-screenreader\'>Open submenu</span></button>';
    html += '<ul class=\'c-nav__submenu c-nav__submenu--depth-' + (depth + 1) + ' u-plain-list\'>';

    item.children.forEach(function(child) {
      html += renderNavItem(child, depth + 1);
    });

    html += '</ul>';
  }

  html += '</li>';

  return html;
}

// Renders the full header nav list for partials/navigation/dist/primary.hbs.
export function renderPrimaryNavigation(items) {
  var html = '{{!-- AUTO-GENERATED from navigation/data/header.js. Do not edit. --}}\n';

  items.forEach(function(item) {
    html += renderNavItem(item, 0);
    html += '\n';
  });

  return html;
}
