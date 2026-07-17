// Section tree for department routing (pilot: News + Lifestyle).
// Compiled into routes.yaml, redirects.yaml, and section partials by
// sections/build.js (`gulp sections` / `gulp build`).
//
// Schema — each node:
//   id       URL path segment (lowercase, numbers, hyphens)
//   label    human display name (Ghost tag name)
//   tag      Ghost tag slug — MUST be `sec-` + full ancestry ids joined by `-`
//            e.g. News > Campus > ASUC  →  sec-news-campus-asuc
//   children optional array of child nodes (any depth)
//
// The path is derived from ancestry (News > Campus → /news/campus/), so it is
// NOT stored here. build.js validates that each `tag` matches its ancestry and
// throws otherwise.
//
// Editorial rules:
//   1. Each post gets exactly ONE sec-* tag as its primary (first) tag
//   2. Never also tag the parent — the leaf/desk tag alone is enough
//   3. Editors type "sec-" in the tag picker to find every section
//   4. Tag display name is human ("Campus"); the sec-* slug is invisible to readers

export const sections = [
  {
    id: 'news',
    label: 'News',
    tag: 'sec-news',
    children: [
      {
        id: 'campus',
        label: 'Campus',
        tag: 'sec-news-campus',
        children: [
          { id: 'asuc', label: 'ASUC', tag: 'sec-news-campus-asuc' },
          { id: 'academics', label: 'Academics', tag: 'sec-news-campus-academics' },
        ],
      },
      { id: 'city', label: 'City', tag: 'sec-news-city' },
      { id: 'county', label: 'County', tag: 'sec-news-county' },
      { id: 'state', label: 'State', tag: 'sec-news-state' },
      { id: 'national', label: 'National', tag: 'sec-news-national' },
      { id: 'obituaries', label: 'Obituaries', tag: 'sec-news-obituaries' },
      { id: 'investigations', label: 'Investigations', tag: 'sec-news-investigations' },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    tag: 'sec-lifestyle',
    children: [
      { id: 'how-to', label: 'How-To', tag: 'sec-lifestyle-how-to' },
      { id: 'local-guides', label: 'Local Guides', tag: 'sec-lifestyle-local-guides' },
      { id: 'quizzes', label: 'Quizzes', tag: 'sec-lifestyle-quizzes' },
      { id: 'strikeout', label: 'Strikeout', tag: 'sec-lifestyle-strikeout' },
    ],
  },
];
