// Header navigation source of truth.
// Compiled to partials/navigation/dist/primary.hbs at build time.

export default [
  // Featured
  {
    label: 'Featured',
    url: '/tag/featured/',
    children: [
      { label: 'Special Issues', url: '/tag/special-issues/' },
      { label: "Editor's Picks", url: '/tag/editors-picks/' },
      { label: 'Awards', url: '/tag/awards/' },
    ],
  },

  // News
  {
    label: 'News',
    url: '/tag/news/',
    children: [
      { label: 'Campus', url: '/tag/campus/' },
      { label: 'City', url: '/tag/city/' },
      { label: 'County', url: '/tag/county/' },
      { label: 'State', url: '/tag/state/' },
      { label: 'National', url: '/tag/national/' },
      { label: 'Obituaries', url: '/tag/obituaries/' },
      { label: 'Investigations', url: '/tag/investigations/' },
    ],
  },

  // Sports
  {
    label: 'Sports',
    url: '/tag/sports/',
    children: [
      {
        label: "Men's Sports",
        url: '/tag/mens-sports/',
        children: [
          { label: 'Baseball', url: '/tag/mens-baseball/' },
          { label: 'Basketball', url: '/tag/mens-basketball/' },
          { label: 'Football', url: '/tag/football/' },
          { label: 'Golf', url: '/tag/mens-golf/' },
          { label: 'Gymnastics', url: '/tag/mens-gymnastics/' },
          { label: 'Rugby', url: '/tag/rugby/' },
          { label: 'Soccer', url: '/tag/mens-soccer/' },
          { label: 'Swimming & Diving', url: '/tag/mens-swimming-diving/' },
          { label: 'Tennis', url: '/tag/mens-tennis/' },
          { label: 'Water Polo', url: '/tag/mens-water-polo/' },
        ],
      },
      {
        label: "Women's Sports",
        url: '/tag/womens-sports/',
        children: [
          { label: 'Basketball', url: '/tag/womens-basketball/' },
          { label: 'Beach Volleyball', url: '/tag/beach-volleyball/' },
          { label: 'Field Hockey', url: '/tag/field-hockey/' },
          { label: 'Golf', url: '/tag/womens-golf/' },
          { label: 'Gymnastics', url: '/tag/womens-gymnastics/' },
          { label: 'Lacrosse', url: '/tag/lacrosse/' },
          { label: 'Soccer', url: '/tag/womens-soccer/' },
          { label: 'Softball', url: '/tag/softball/' },
          { label: 'Swimming & Diving', url: '/tag/womens-swimming-diving/' },
          { label: 'Tennis', url: '/tag/womens-tennis/' },
          { label: 'Volleyball', url: '/tag/volleyball/' },
          { label: 'Water Polo', url: '/tag/womens-water-polo/' },
        ],
      },
      { label: 'Track and Field', url: '/tag/track-and-field/' },
      { label: 'Cross Country', url: '/tag/cross-country/' },
      { label: 'Crew', url: '/tag/crew/' },
      { label: 'Bear Bytes', url: '/tag/bear-bytes/' },
      { label: 'Columns', url: '/tag/sports-columns/' },
      { label: 'Special Report', url: '/tag/sports-special-report/' },
    ],
  },

  // Arts
  {
    label: 'Arts',
    url: '/tag/arts/',
    children: [
      { label: 'Music', url: '/tag/music/' },
      { label: 'Film & Television', url: '/tag/film-television/' },
      { label: 'Theater', url: '/tag/theater/' },
      { label: 'Visual Arts', url: '/tag/visual-arts/' },
      { label: 'Literature', url: '/tag/literature/' },
      { label: 'Fashion', url: '/tag/fashion/' },
      { label: 'Column', url: '/tag/arts-column/' },
      { label: 'Culture Shot', url: '/tag/culture-shot/' },
      { label: 'Video Games', url: '/tag/video-games/' },
      { label: 'Comedy', url: '/tag/comedy/' },
      { label: 'Local Events', url: '/tag/local-events/' },
      { label: 'Arts Awards', url: '/tag/arts-awards/' },
      { label: 'Dance', url: '/tag/dance/' },
      { label: 'Festivals', url: '/tag/festivals/' },
    ],
  },

  // Opinion
  {
    label: 'Opinion',
    url: '/tag/opinion/',
    children: [
      { label: 'Editorials', url: '/tag/editorials/' },
      { label: 'Columns', url: '/tag/opinion-columns/' },
      { label: 'Op-Eds', url: '/tag/op-eds/' },
      { label: 'Our Voices', url: '/tag/our-voices/' },
      { label: 'Letters to the Editor', url: '/tag/letters-to-the-editor/' },
      { label: 'The Soapbox', url: '/tag/the-soapbox/' },
    ],
  },

  // Lifestyle
  {
    label: 'Lifestyle',
    url: '/tag/lifestyle/',
    children: [
      { label: 'How-To', url: '/tag/how-to/' },
      { label: 'Local Guides', url: '/tag/local-guides/' },
      { label: 'Quizzes', url: '/tag/quizzes/' },
      { label: 'Strikeout', url: '/tag/strikeout/' },
    ],
  },

  // Multimedia
  {
    label: 'Multimedia',
    url: '/tag/multimedia/',
    children: [
      { label: 'Video', url: '/tag/video/' },
      { label: 'Photo Essays', url: '/tag/photo-essays/' },
      { label: 'Podcasts', url: '/tag/podcasts/' },
      { label: 'Cartoons', url: '/tag/cartoons/' },
    ],
  },

  // Weekender
  {
    label: 'Weekender',
    url: '/tag/weekender/',
    children: [
      { label: 'Back and Forth', url: '/tag/back-and-forth/' },
      { label: 'Commentary', url: '/tag/weekender-commentary/' },
      { label: 'Features', url: '/tag/weekender-features/' },
      { label: 'Personal Essays', url: '/tag/personal-essays/' },
      { label: 'Poems', url: '/tag/poems/' },
      { label: 'Fiction', url: '/tag/fiction/' },
      { label: 'Zine', url: '/tag/zine/' },
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
    url: '/tag/puzzles/',
  },
];
