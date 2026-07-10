// Ad placement registry: source of truth for slot IDs
// Each entry is compiled to partials/ads/dist/<name>.hbs at build time.
// Supported sizes: `leaderboard`, `rectangle`, `halfpage`, `mobile-banner`, `responsive`.

export const placements = {
  'home-top': {
    size: 'leaderboard',
    slot: '',
  },
  'post-below-content': {
    size: 'rectangle',
    slot: '',
  },
};
