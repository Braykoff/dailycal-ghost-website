import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    ignores: [
      'assets/js/app.min.js',
      'bower_components/**',
      'node_modules/**',
    ],
  },
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        $: 'readonly',
        jQuery: 'readonly',
        tocbot: 'readonly',
        refreshFsLightbox: 'readonly',
        pagination_next_page_number: 'writable',
        pagination_available_pages_number: 'readonly',
        pagination_loading_text: 'readonly',
        pagination_more_posts_text: 'readonly',
      },
    },
  },
  {
    files: ['gulpfile.js', 'navigation/**/*.js', 'sections/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
