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