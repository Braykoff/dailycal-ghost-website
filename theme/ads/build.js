// Compiles ads/data/placements.js into partials/ads/dist/*.hbs wrappers.

// Escape user-facing strings before embedding them in HTML attributes/text.
function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;');
}

// Generate hbs file content for a specific ad configuration.
export function renderPlacementPartial(name, config) {
  const size = escapeAttr(config.size);
  const slot = escapeAttr(config.slot);
  const placement = escapeAttr(name);

  return [
    `{{!-- ${name} — generated from ads/data/placements.js --}}`,
    `{{> ads/advertisement name='${placement}' size='${size}' slot='${slot}'}}`,
    '',
  ].join('\n');
}
