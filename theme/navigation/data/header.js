// Header navigation source of truth.
// Compiled to partials/navigation/dist/header.hbs at build time.

export default [
  // Featured
  {
    label: 'Featured',
    url: '/featured/',
    children: [
      { label: 'Special Issues', url: '/featured/special-issues/' },
      { label: "Editor's Picks", url: '/featured/editors-picks/' },
      { label: 'Awards', url: '/featured/awards/' },
    ],
  },

  // News
  {
    label: 'News',
    url: '/news/',
    children: [
      { label: 'Campus', url: '/news/campus/' },
      { label: 'City', url: '/news/city/' },
      { label: 'County', url: '/news/alameda-county/' },
      { label: 'State', url: '/news/state/' },
      { label: 'National', url: '/news/national/' },
      { label: 'Obituaries', url: '/news/obituary-news/' },
      { label: 'Investigations', url: '/news/investigations/' },
    ],
  },

  // Sports
  {
    label: 'Sports',
    url: '/sports/',
    children: [
      {
        label: "Men's Sports",
        url: '/sports/msports/',
        children: [
          { label: 'Baseball', url: '/sports/msports/baseball/' },
          { label: 'Basketball', url: '/sports/msports/basketball/' },
          { label: 'Football', url: '/sports/msports/football/' },
          { label: 'Golf', url: '/sports/msports/golf/' },
          { label: 'Gymnastics', url: '/sports/msports/gymnastics/' },
          { label: 'Rugby', url: '/sports/msports/rugby/' },
          { label: 'Soccer', url: '/sports/msports/soccer/' },
          { label: 'Swimming & Diving', url: '/sports/msports/swimming-and-diving/' },
          { label: 'Tennis', url: '/sports/msports/tennis/' },
          { label: 'Water Polo', url: '/sports/msports/water-polo/' },
        ],
      },
      {
        label: "Women's Sports",
        url: '/sports/wsports/',
        children: [
          { label: 'Basketball', url: '/sports/wsports/basketball/' },
          { label: 'Beach Volleyball', url: '/sports/wsports/beach-volleyball/' },
          { label: 'Field Hockey', url: '/sports/wsports/field-hockey/' },
          { label: 'Golf', url: '/sports/wsports/golf/' },
          { label: 'Gymnastics', url: '/sports/wsports/gymnastics/' },
          { label: 'Lacrosse', url: '/sports/wsports/lacrosse/' },
          { label: 'Soccer', url: '/sports/wsports/soccer/' },
          { label: 'Softball', url: '/sports/wsports/softball/' },
          { label: 'Swimming & Diving', url: '/sports/wsports/swimming-and-diving/' },
          { label: 'Tennis', url: '/sports/wsports/tennis/' },
          { label: 'Volleyball', url: '/sports/wsports/volleyball/' },
          { label: 'Water Polo', url: '/sports/wsports/water-polo/' },
        ],
      },
      { label: 'Track and Field', url: '/sports/track-and-field/' },
      { label: 'Cross Country', url: '/sports/cross-country/' },
      { label: 'Crew', url: '/sports/crew/' },
      { label: 'Bear Bytes', url: '/sports/bearbytes/' },
      { label: 'Columns', url: '/sports/sports-columns/' },
      { label: 'Special Report', url: '/sports/special-report/' },
    ],
  },

  // Arts
  {
    label: 'Arts',
    url: '/arts/',
    children: [
      { label: 'Music', url: '/arts/music/' },
      { label: 'Film & Television', url: '/arts/film-and-television/' },
      { label: 'Theater', url: '/arts/theater/' },
      { label: 'Visual Arts', url: '/arts/visual-art/' },
      { label: 'Literature', url: '/arts/books/' },
      { label: 'Fashion', url: '/arts/fashion-arts/' },
      { label: 'Column', url: '/arts/art-columns/' },
      { label: 'Culture Shot', url: '/arts/culture-shot/' },
      { label: 'Video Games', url: '/arts/video-games/' },
      { label: 'Comedy', url: '/arts/comedy-arts/' },
      { label: 'Local Events', url: '/arts/local-event/' },
      { label: 'Arts Awards', url: '/arts/arts-awards/' },
      { label: 'Dance', url: '/arts/dance/' },
      { label: 'Festivals', url: '/arts/festivals/' },
    ],
  },

  // Opinion
  {
    label: 'Opinion',
    url: '/opinion/',
    children: [
      { label: 'Editorials', url: '/opinion/editorials/' },
      { label: 'Columns', url: '/opinion/opinion-columns/' },
      { label: 'Op-Eds', url: '/opinion/op-eds/' },
      { label: 'Our Voices', url: '/opinion/our-voices/' },
      { label: 'Letters to the Editor', url: '/opinion/letters-to-the-editor/' },
      { label: 'The Soapbox', url: '/opinion/the-soapbox/' },
    ],
  },

  // Lifestyle
  {
    label: 'Lifestyle',
    url: '/lifestyle/',
    children: [
      { label: 'How-To', url: '/lifestyle/how-to/' },
      { label: 'Local Guides', url: '/lifestyle/local-guides/' },
      { label: 'Quizzes', url: '/lifestyle/quizzes/' },
      { label: 'Strikeout', url: '/lifestyle/strikeout/' },
    ],
  },

  // Multimedia
  {
    label: 'Multimedia',
    url: '/multimedia/',
    children: [
      { label: 'Video', url: '/multimedia/' },
      { label: 'Photo Essays', url: '/multimedia/photo-essays/' },
      { label: 'Podcasts', url: '/multimedia/' },
      { label: 'Cartoons', url: '/cartoons/' },
    ],
  },

  // Weekender
  {
    label: 'Weekender',
    url: '/weekender/',
    children: [
      { label: 'Back and Forth', url: '/weekender/back-and-forth/' },
      { label: 'Commentary', url: '/weekender/commentary/' },
      { label: 'Features', url: '/weekender/features/' },
      { label: 'Personal Essays', url: '/weekender/personal-essays/' },
      { label: 'Poems', url: '/weekender/poems/' },
      { label: 'Fiction', url: '/weekender/fiction/' },
      { label: 'Zine', url: '/weekender/' },
    ],
  },

  // Data
  {
    label: 'Data',
    url: 'https://data.dailycal.org/',
  },

  // Puzzles
  {
    label: 'Puzzles',
    url: '/puzzles/',
  },
];
