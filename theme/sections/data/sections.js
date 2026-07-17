// Section tree for department routing (pilot: News + Lifestyle).
// Compiled into routes.yaml and section partials by
// sections/build.js (`gulp sections` / `gulp build`).
//
// Schema — each node:
//   id       canonical URL path segment (lowercase, numbers, hyphens)
//   label    human display name (may contain spaces, dashes, or underscores)
//   tagSlug  Ghost tag slug — MUST be `sec_` + full ancestry ids joined by `_`
//            e.g. News > Campus > ASUC  →  sec_news_campus_asuc
//            Hyphens inside an id stay hyphens: Lifestyle > How-To
//            → sec_lifestyle_how-to
//   children optional array of child nodes (any depth)
//
// The path is derived from ancestry (News > Campus → /news/campus/), so it is
// NOT stored here. build.js validates that each `tagSlug` matches its ancestry
// and throws otherwise.
//
// Editorial rules:
//   1. Each post gets exactly ONE sec_* tag as its primary (first) tag
//   2. Never also tag the parent — the leaf/desk tag alone is enough
//   3. Editors type "sec_" in the tag picker to find every section
//   4. Tag display name is human ("Campus"); the sec_* slug is invisible to readers
//   5. Tags are reserved for sections; legacy keywords live in head injection

export const sections = [
  // News
  { id: 'news', label: 'News', tagSlug: 'sec_news', children: [
    { id: 'campus', label: 'Campus', tagSlug: 'sec_news_campus', children: [
      { id: 'asuc', label: 'ASUC', tagSlug: 'sec_news_campus_asuc' },
      { id: 'academics', label: 'Academics', tagSlug: 'sec_news_campus_academics' },
    ]},
    { id: 'city', label: 'City', tagSlug: 'sec_news_city' },
    { id: 'county', label: 'County', tagSlug: 'sec_news_county' },
    { id: 'state', label: 'State', tagSlug: 'sec_news_state' },
    { id: 'national', label: 'National', tagSlug: 'sec_news_national' },
    { id: 'obituaries', label: 'Obituaries', tagSlug: 'sec_news_obituaries' },
    { id: 'investigations', label: 'Investigations', tagSlug: 'sec_news_investigations' },
  ]},
  
  // Lifestyle
  { id: 'lifestyle', label: 'Lifestyle', tagSlug: 'sec_lifestyle', children: [
    { id: 'how-to', label: 'How-To', tagSlug: 'sec_lifestyle_how-to' },
    { id: 'local-guides', label: 'Local Guides', tagSlug: 'sec_lifestyle_local-guides' },
    { id: 'quizzes', label: 'Quizzes', tagSlug: 'sec_lifestyle_quizzes' },
    { id: 'strikeout', label: 'Strikeout', tagSlug: 'sec_lifestyle_strikeout' },
  ]},
];
