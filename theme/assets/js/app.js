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
  // Navigation (toggle / mobile interactions)
  // =====================

  var navigation_mobile_media = window.matchMedia('(max-width: 1023px)');

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

    if (!submenu || !navigation_mobile_media.matches) {
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

  function toggle_navigation_item($item) {
    var is_open = $item.hasClass('is-open');

    close_navigation_items($item.siblings('.c-nav__item--has-children'));
    close_navigation_items($item.siblings().find('.c-nav__item--has-children'));

    if (!is_open) {
      position_mobile_navigation_submenu($item);
    }

    set_navigation_item_open($item, !is_open);
  }

  function init_navigation() {
    if (!$('.c-nav--main').length) {
      return;
    }

    $('.js-nav-toggle').on('click', function(e) {
      var $item = $(this).closest('.c-nav__item--has-children');

      e.preventDefault();
      e.stopPropagation();

      toggle_navigation_item($item);
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

  init_navigation();

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