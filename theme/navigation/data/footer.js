// Footer navigation source of truth.
// Compiled to partials/navigation/dist/footer.hbs at build time.

// Site sections flow left-to-right in siteNavigation order, wrapping after this many per row.
export const siteSectionsPerRow = 4;

// Site section links (hidden on small screens)
export const siteNavigation = [
  // Featured
  {
    label: 'Featured',
    url: '/featured',
    children: [
      { label: 'Special Issues', url: '/featured/special-issues' },
      { label: "Editor's Picks", url: '/featured/editors-picks' },
      { label: 'Awards', url: '/featured/awards' },
      { label: 'Photo Essays', url: '/multimedia/photo-essays' },
    ],
  },

  // News
  {
    label: 'News',
    url: '/news',
    children: [
      { label: 'Campus', url: '/news/campus' },
      { label: 'City', url: '/news/city' },
      { label: 'County', url: '/news/alameda-county' },
      { label: 'State', url: '/news/state' },
      { label: 'National', url: '/news/national' },
      { label: 'Obituaries', url: '/news/obituary-news' },
      { label: 'Notes from the Field', url: '/blogs/news-blog' },
    ],
  },

  // Sports
  {
    label: 'Sports',
    url: '/sports',
    children: [
      { label: 'Football', url: '/sports/msports/football/' },
      { label: 'M. Hoops', url: '/sports/msports/basketball/' },
      { label: 'W. Hoops', url: '/sports/wsports/basketball/' },
      { label: 'Baseball', url: '/sports/msports/baseball/' },
      { label: 'Softball', url: '/sports/wsports/softball/' },
      { label: 'Bear Bytes', url: '/sports/bearbytes/' },
      { label: 'Columns', url: '/sports/sports-columns' },
      { label: 'Special Report', url: '/sports/special-report' },
    ],
  },

  // Arts
  {
    label: 'Arts',
    url: '/arts',
    children: [
      { label: 'Music', url: '/arts/music' },
      { label: 'Film & Television', url: '/arts/film-and-television' },
      { label: 'Theater', url: '/arts/theater' },
      { label: 'Visual Art', url: '/arts/visual-art' },
      { label: 'Literature', url: '/arts/books' },
      { label: 'Fashion', url: '/arts/fashion-arts' },
      { label: 'Columns', url: '/arts/art-columns' },
      { label: 'Culture Shot', url: '/blogs/arts-blog' },
      { label: 'Video Games', url: '/arts/video-games' },
      { label: 'Comedy', url: '/arts/comedy-arts' },
      { label: 'Local Events', url: '/arts/local-event' },
      { label: 'Arts Awards', url: '/arts/arts-awards' },
    ],
  },

  // Opinion
  {
    label: 'Opinion',
    url: '/opinion',
    children: [
      { label: 'Editorials', url: '/opinion/editorials' },
      { label: 'Op-Eds', url: '/opinion/op-eds' },
      { label: 'Letters to the Editor', url: '/opinion/letters-to-the-editor' },
      { label: 'Columns', url: '/opinion/opinion-columns' },
      { label: 'Editorial Cartoons', url: '/opinion/cartoons' },
    ],
  },

  // Lifestyle
  {
    label: 'Lifestyle',
    url: '/lifestyle',
    children: [
      { label: 'How To', url: '/lifestyle/how_to' },
      { label: 'Local Guides', url: '/lifestyle/local_guides' },
      { label: 'Quizzes', url: '/lifestyle/quizzes' },
      { label: 'Strikeout', url: '/lifestyle/strikeout' },
    ],
  },

  // Weekender
  {
    label: 'Weekender',
    url: '/weekender',
    children: [
      { label: 'Back & Forth', url: '/weekender/back_and_forth' },
      { label: 'Commentary', url: '/weekender/commentary/' },
      { label: 'Features', url: '/weekender/features' },
      { label: 'Personal Essays', url: '/weekender/personal_essays' },
      { label: 'Poems', url: '/weekender/poems' },
      { label: 'Fiction', url: '/weekender/fiction' },
    ],
  },

  // Multimedia
  {
    label: 'Multimedia',
    url: '/multimedia',
    children: [
      { label: 'News: City', url: '/multimedia/multimedia-newscity' },
      { label: 'News: Campus', url: '/multimedia/multimedia-newscampus' },
      { label: 'Sports', url: '/multimedia/sports-multimedia' },
      { label: 'Arts', url: '/multimedia/arts-multimedia' },
      { label: 'Entertainment', url: '/multimedia/entertainment-multimedia' },
      { label: 'Insider', url: '/multimedia/opinion-multimedia' },
    ],
  },

  // Data
  {
    label: 'Data',
    url: 'https://dailycal-projects.netlify.app/',
  },

  // Puzzles
  {
    label: 'Puzzles',
    url: '/puzzles/',
  },
];

// Advertise, classifieds, legals, about (Always visible, rightmost column on desktop)
export const utilityNavigation = [
  {
    label: 'Advertise',
    url: '/advertise/',
  },
  {
    label: 'Classifieds',
    url: '/classifieds/',
  },
  {
    label: 'Legals',
    url: '/legals/',
    children: [
      { label: 'Browse Notices', url: '/legals/browse/' },
      { label: 'Place Notices', url: '/legals/place/' },
    ],
  },
  {
    label: 'About',
    url: '/about/',
    children: [
      { label: 'Contact Us', url: '/about/contact/' },
    ],
  },
];
