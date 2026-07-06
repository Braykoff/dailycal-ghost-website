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
