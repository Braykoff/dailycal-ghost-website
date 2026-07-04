$(document).ready(function() {

  'use strict';

  // =====================
  // Table of Contents
  // =====================

  if ( $('.c-table-of-contents').length ) {
    tocbot.init({
      tocSelector: '.c-table-of-contents__content',
      contentSelector: '.c-content',
      listClass: 'c-table-of-contents__list',
      listItemClass: 'c-table-of-contents__list-item',
      linkClass: 'c-table-of-contents__list-link',
      headingSelector: 'h2, h3',
      ignoreSelector: '.kg-header-card > *',
      hasInnerContainers: true,
      scrollSmooth: false
    });
  }

  if ( $('.c-table-of-contents__content').children().length > 0 ) {
    $('.c-table-of-contents').show();
  }

  // =====================
  // Koenig Gallery
  // =====================
  var gallery_images = document.querySelectorAll('.kg-gallery-image img');

  gallery_images.forEach(function (image) {
    var container = image.closest('.kg-gallery-image');
    var width = image.attributes.width.value;
    var height = image.attributes.height.value;
    var ratio = width / height;
    container.style.flex = ratio + ' 1 0%';
  });

  // =====================
  // Decode HTML entities returned by Ghost translations
  // Input: Plus d&#x27;articles
  // Output: Plus d'articles
  // =====================

  function decoding_translation_chars(string) {
    return $('<textarea/>').html(string).text();
  }

  // =====================
  // Responsive videos
  // =====================

  const embed_sources = [
    'iframe[src*="ted.com"]',
    'iframe[src*="loom.com"]',
    'iframe[src*="facebook.com"]',
    'iframe[src*="dailymotion.com"]',
    'iframe[src*="player.twitch.tv"]'
  ];

  $('.c-content').fitVids({ 'customSelector': embed_sources });

  // =====================
  // Responsive tables
  // =====================

  $('.c-content table').wrap("<div class='responsive-table'></div>");

  // =====================
  // Nested Navigation
  // =====================

  var navigation_marker_keys = ['nav-has-children', 'nav-child', 'nav-grandchild'],
    navigation_mobile_media = window.matchMedia('(max-width: 1023px)');

  function navigation_query_keys(url) {
    var url_without_hash = url.split('#')[0],
      query = url_without_hash.split('?')[1] || '';

    return query.split('&').filter(function(param) {
      return param.length;
    }).map(function(param) {
      return decodeURIComponent(param.split('=')[0] || '');
    });
  }

  function has_navigation_marker(url, key) {
    return navigation_query_keys(url).some(function(query_key) {
      return query_key === key;
    });
  }

  function clean_navigation_url(url) {
    var hash_parts = url.split('#'),
      url_without_hash = hash_parts.shift(),
      hash = hash_parts.length ? '#' + hash_parts.join('#') : '',
      url_parts = url_without_hash.split('?'),
      base_url = url_parts.shift(),
      query = url_parts.join('?'),
      clean_params = [];

    if (!query) {
      return url;
    }

    query.split('&').forEach(function(param) {
      var key = decodeURIComponent((param.split('=')[0] || ''));

      if (navigation_marker_keys.indexOf(key) === -1) {
        clean_params.push(param);
      }
    });

    return base_url + (clean_params.length ? '?' + clean_params.join('&') : '') + hash;
  }

  function navigation_item_depth(url) {
    if (has_navigation_marker(url, 'nav-grandchild')) {
      return 2;
    }

    if (has_navigation_marker(url, 'nav-child')) {
      return 1;
    }

    return 0;
  }

  function navigation_item_has_children(url) {
    return has_navigation_marker(url, 'nav-has-children');
  }

  function get_navigation_submenu(item, depth) {
    var $item = $(item),
      $submenu = $item.children('.c-nav__submenu').first();

    if (!$submenu.length) {
      $submenu = $('<ul class="c-nav__submenu c-nav__submenu--depth-' + depth + ' u-plain-list"></ul>');
      $item.append($submenu);
    }

    return $submenu;
  }

  function set_navigation_item_open($item, is_open) {
    $item.toggleClass('is-open', is_open);
    $item.children('.js-nav-toggle, .c-nav__link').attr('aria-expanded', is_open ? 'true' : 'false');

    if (!is_open) {
      $item.children('.js-nav-toggle, .c-nav__link').trigger('blur');

      $item.find('.c-nav__item--has-children').each(function() {
        set_navigation_item_open($(this), false);
      });
    }
  }

  function close_navigation_items($items) {
    $items.each(function() {
      set_navigation_item_open($(this), false);
    });
  }

  function position_mobile_navigation_submenu($item) {
    var submenu = $item.children('.c-nav__submenu--depth-1').first()[0],
      rect,
      submenu_width,
      left,
      top;

    if (!submenu || !is_mobile_navigation_layout()) {
      return;
    }

    rect = $item[0].getBoundingClientRect();
    submenu_width = Math.min(288, window.innerWidth - 32);
    left = Math.min(Math.max(rect.left, 16), window.innerWidth - submenu_width - 16);
    top = rect.bottom + 8;

    submenu.style.setProperty('--nav-submenu-left', left + 'px');
    submenu.style.setProperty('--nav-submenu-top', top + 'px');
    submenu.style.setProperty('--nav-submenu-width', submenu_width + 'px');
  }

  function ensure_navigation_toggle(item, label) {
    var toggle = item.querySelector('.js-nav-toggle');

    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'c-nav__toggle js-nav-toggle';
      toggle.innerHTML = '<span class="u-screenreader">Open submenu</span>';

      item.insertBefore(toggle, item.querySelector('.c-nav__submenu'));
    }

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Toggle ' + (label || 'navigation') + ' submenu');
  }

  function ensure_navigation_parent(item) {
    var link = item.querySelector('.c-nav__link');

    item.classList.add('c-nav__item--has-children');

    if (link) {
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      ensure_navigation_toggle(item, link.textContent);
    }
  }

  function is_mobile_navigation_layout() {
    return navigation_mobile_media.matches;
  }

  function toggle_navigation_item($item) {
    var is_open = $item.hasClass('is-open');

    close_navigation_items($item.siblings('.c-nav__item--has-children'));
    close_navigation_items($item.siblings().find('.c-nav__item--has-children'));

    if (!is_open) {
      position_mobile_navigation_submenu($item);
    }

    set_navigation_item_open($item, !is_open);
  }

  function init_nested_navigation() {
    var $nav = $('.c-nav--main'),
      nav_items = [],
      current_items = [];

    if (!$nav.length) {
      return;
    }

    $nav.children('.js-nav-item').each(function() {
      var item = this,
        raw_url = item.getAttribute('data-nav-url') || '',
        clean_url = clean_navigation_url(raw_url),
        link = item.querySelector('.c-nav__link'),
        depth = navigation_item_depth(raw_url);

      if (link) {
        link.setAttribute('href', clean_url);
      }

      item.removeAttribute('data-nav-url');
      item.classList.remove('c-nav__item--pending-child', 'c-nav__item--pending-grandchild');

      nav_items.push({
        item: item,
        depth: depth,
        has_children: navigation_item_has_children(raw_url)
      });
    });

    nav_items.forEach(function(nav_item, index) {
      var next_item = nav_items[index + 1];

      if (nav_item.has_children || (next_item && next_item.depth > nav_item.depth)) {
        ensure_navigation_parent(nav_item.item);
      }
    });

    nav_items.forEach(function(nav_item) {
      var parent;

      if (nav_item.depth === 0) {
        current_items[0] = nav_item.item;
        current_items[1] = null;
        return;
      }

      parent = current_items[nav_item.depth - 1] || current_items[0];

      if (parent) {
        ensure_navigation_parent(parent);
        nav_item.item.classList.add('c-nav__item--child', 'c-nav__item--depth-' + nav_item.depth);
        get_navigation_submenu(parent, nav_item.depth).append(nav_item.item);

        if (nav_item.depth === 1) {
          current_items[1] = nav_item.item;
        }

        return;
      }

      current_items[nav_item.depth] = nav_item.item;
    });

    $('.js-nav-toggle').on('click', function(e) {
      var $item = $(this).closest('.c-nav__item--has-children');

      e.preventDefault();
      e.stopPropagation();

      toggle_navigation_item($item);
    });

    $('.c-nav__item--has-children > .c-nav__link').on('click', function(e) {
      if (is_mobile_navigation_layout()) {
        e.preventDefault();
        e.stopPropagation();

        toggle_navigation_item($(this).closest('.c-nav__item--has-children'));
      }
    });

    $(document).on('click', function(e) {
      if (!$(e.target).closest('.c-nav').length) {
        close_navigation_items($('.c-nav__item--has-children'));
      }
    });

    $(document).on('keyup', function(e) {
      if (e.key === 'Escape') {
        close_navigation_items($('.c-nav__item--has-children'));
      }
    });
  }

  init_nested_navigation();

  // =====================
  // Sticky Navigation
  // =====================

  function init_sticky_navigation() {
    var nav = document.querySelector('.js-sticky-nav'),
      placeholder,
      nav_top = 0;

    if (!nav) {
      return;
    }

    placeholder = nav.parentNode;

    function set_placeholder_height() {
      placeholder.style.height = nav.classList.contains('is-fixed') ? nav.offsetHeight + 'px' : '';
    }

    function update_sticky_navigation() {
      var should_fix = window.pageYOffset >= nav_top;

      nav.classList.toggle('is-fixed', should_fix);
      set_placeholder_height();
    }

    function measure_sticky_navigation() {
      nav.classList.remove('is-fixed');
      placeholder.style.height = '';
      nav_top = placeholder.getBoundingClientRect().top + window.pageYOffset;
      update_sticky_navigation();
    }

    measure_sticky_navigation();
    window.addEventListener('scroll', update_sticky_navigation, { passive: true });
    window.addEventListener('resize', measure_sticky_navigation);
  }

  init_sticky_navigation();

  // =====================
  // Images Lightbox
  // https://fslightbox.com/
  // https://forum.ghost.org/t/how-to-add-lightbox-to-ghost-blog/12647/7
  // =====================

  var images = document.querySelectorAll('.kg-image-card img, .kg-gallery-card img');

  images.forEach(function (image) {
    var wrapper = document.createElement('a');
    wrapper.setAttribute('data-no-swup', '');
    wrapper.setAttribute('data-fslightbox', '');
    wrapper.setAttribute('href', image.src);
    wrapper.setAttribute('class', 'fslightbox-image-wrap');
    image.parentNode.insertBefore(wrapper, image.parentNode.firstChild);
    wrapper.appendChild(image);
  });

  refreshFsLightbox();

  // Remove the lightbox if the image is linked
  $('.kg-image-card a a').children('img').unwrap();

  // =====================
  // Ajax More
  // =====================

  var pagination_next_url = $('link[rel=next]').attr('href'),
    $load_posts_button = $('.js-load-cards');

  $load_posts_button.click(function(e) {
    e.preventDefault();

    var request_next_link = String(pagination_next_url).replace(
      /\/page\/\d+\/?$/,
      '/page/' + pagination_next_page_number + '/'
    );

    $.ajax({
      url: request_next_link,
      beforeSend: function() {
        $load_posts_button.text(decoding_translation_chars(pagination_loading_text));
        $load_posts_button.addClass('c-btn--loading');
      }
    }).done(function(data) {
      var posts = $('.js-card', data);

      $('.js-grid').append(posts);

      $load_posts_button.text(decoding_translation_chars(pagination_more_posts_text));
      $load_posts_button.removeClass('c-btn--loading');

      pagination_next_page_number++;

      // If you are on the last pagination page, hide the load more button
      if (pagination_next_page_number > pagination_available_pages_number) {
        $load_posts_button.addClass('c-btn--disabled').attr('disabled', true);
      }
    });
  });
});