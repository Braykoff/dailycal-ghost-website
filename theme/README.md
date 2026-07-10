# Daily Cal Ghost Theme

Built from the Tripoli theme ([Tripoli documentation](https://aspirethemes.com/docs/tripoli)). Major modifications listed below may supersede Tripoli documentation.

---

## DC Modifications

### 1. Navigation (header)

Header navigation is defined in `navigation/data/header.js` and compiled to `partials/navigation/dist/header.hbs` at build time (`gulp navigation` or `gulp build`).

Edit `navigation/data/header.js` to change labels, URLs, or hierarchy (supports children, grandchildren, etc). Rebuild the theme after changes.

In the Ghost admin panel, you can usually specify the header navigation in Settings > Navigation (Customize > Primary). Due to the complexity and quantity of navigation elements used, this setting is ignored now.

### 2. Navigation (footer)

Footer navigation is defined in `navigation/data/footer.js` (`siteNavigation`, `utilityNavigation`, and `siteSectionsPerRow`) and compiled to `partials/navigation/dist/footer.hbs` at build time (`gulp navigation` or `gulp build`).

Site sections render left-to-right in `siteNavigation` order, wrapping every `siteSectionsPerRow` items. Utility links (Advertise, Classifieds, Legals, About) remain visible on all screen sizes, while site sections are hidden on mobile.

Edit `navigation/data/footer.js` to change labels, URLs, or hierarchy (only supports children). Rebuild the theme after changes.

In the Ghost admin panel, you can usually specify the header navigation in Settings > Navigation (Customize > Secondary). Due to the complexity and quantity of navigation elements used, this setting is ignored now.

### 3. Footer copyright

The footer copyright is in `partials/structure/footer.hbs`. The address is hardcoded in and the Tripoli link has been removed.

### 4. Social links

This theme has two separate social features:

**1. Footer profile links** (`partials/social-icons.hbs`): icons in the footer that link to social accounts. Edit this file to change which platforms appear and in what order.

| Config source | Ghost Admin location | Platforms |
|---------------|---------------------|-----------|
| Site settings | Settings > Social accounts | X, Facebook, LinkedIn, Bluesky, Mastodon, YouTube, Instagram, TikTok, Threads |
| Theme settings | Settings > Design & Branding > Theme | Pinterest, Discord |
| Hardcoded in theme | `partials/social-icons.hbs` | RSS |

**2. Post share buttons** (`partials/share.hbs`): per-post share actions. These are not configured in site or theme settings. Edit `partials/share.hbs` to change which share options appear.

**Icons:** Tripoli used [Evil Icons](https://github.com/evil-icons/evil-icons), Bootstrap, and Font Awesome. Evil Icons has been removed; all icons are now [Bootstrap Icons](https://icons.getbootstrap.com/) SVGs saved as partials in `partials/icons/`. To add one, copy an SVG from Bootstrap Icons into a new file there (e.g. `partials/icons/example.hbs`) and include it with `{{> icons/example }}`.

### 5. Advertisements (Google AdSense)

Ad placements are defined in `ads/data/placements.js` (placement name, size, and AdSense slot ID) and compiled to `partials/ads/dist/*.hbs` at build time (`gulp ads` or `gulp build`). The placement name (e.g. `home-top`) is shown in preview placeholders; the slot ID is used for live AdSense. Include a placement in a template with:

```handlebars
{{> ads/dist/home-top }}
```

`partials/ads/advertisement.hbs` is the core partial, it renders a gray preview placeholder or a live AdSense unit. Supported sizes: `leaderboard`, `rectangle`, `halfpage`, `mobile-banner`, `responsive`. Unfilled live slots collapse via `app.js` once AdSense sets `data-ad-status="unfilled"`.

| Theme setting | Purpose |
|---------------|---------|
| **Enable ads** | Master on/off switch |
| **Preview ad slots** | When on, shows gray placeholders instead of AdSense (default off, for testing only) |
| **AdSense publisher ID** | Your `ca-pub-…` client ID |

To add a placement: add an entry to `ads/data/placements.js`, run `npm run build`, and include `{{> ads/dist/your-placement-name }}` in the relevant template.
