# URL routing and data

This theme customizes Ghost's URL structure via `routes.yaml` and `redirects.yaml`.

Both files are **generated** and git-ignored. The build merges a handwritten
base with auto-generated section entries:

```
routes-default.yaml    ─┐
sections/data/sections.js ├─► sections/build.js ─► routes.yaml
                        ─┘                       ─► redirects.yaml
redirects-default.yaml ──┘                       ─► partials/sections/dist/*
```

- Edit the `*-default.yaml` files for handwritten routes/redirects.
- Edit `sections/data/sections.js` for the section tree.
- Never edit `routes.yaml` / `redirects.yaml` — run `gulp sections` / `gulp build`.

Ghost matches a request against **routes → collections → taxonomies → pages**.

---

## Overview

| URL pattern | Kind | Template | What it shows |
|-------------|------|----------|---------------|
| `/` | Custom route | `home.hbs` | Curated homepage |
| `/archive/` | Channel | `archive.hbs` | Date-grouped archive |
| `/news/`, `/lifestyle/` | Section **channel** | `section-parent.hbs` | Desk index: posts in that desk **or any descendant** |
| `/news/campus/` | Section channel or collection | `section-parent.hbs` / `section.hbs` | Index for that node (channel if it has children, collection if a leaf) |
| `/news/campus/asuc/` | Section **collection** | `section.hbs` | Leaf index + owns leaf post URLs |
| `/news/{slug}/` | Node permalink | `post.hbs` | Desk-level posts (`primary_tag: sec-news`) via hidden `/_/news/` collection |
| `/news/campus/asuc/{slug}/` | Leaf permalink | `post.hbs` | Subsection posts |
| `/article/` + `/article/{slug}/` | Catch-all collection | `index.hbs` / `post.hbs` | Posts with no section tag |
| `/tag/{slug}/` | Taxonomy | `tag.hbs` | Topic tags; **section (`sec-*`) tags redirect** to their section path |
| `/author/{slug}/` | Taxonomy | `author.hbs` | Author archives |

---

## Department sections

Ghost has no native categories. Sections use **one primary tag per post** whose
slug encodes the full ancestry with a `sec-` prefix.

### The slug convention

Each node's tag slug is `sec-` + its path segments joined by `-`:

| Node | Path | Tag slug |
|------|------|----------|
| News | `/news/` | `sec-news` |
| News › Campus | `/news/campus/` | `sec-news-campus` |
| News › Campus › ASUC | `/news/campus/asuc/` | `sec-news-campus-asuc` |
| Lifestyle › How-To | `/lifestyle/how-to/` | `sec-lifestyle-how-to` |

`build.js` **validates** every slug against its ancestry (case-insensitive) and
throws if they disagree, so `routes.yaml` can never drift from the tree.

### Editorial rules

1. **First tag** = exactly one section tag (`sec-news-campus`, `sec-news`, …) — never both a parent and a leaf
2. Do **not** also tag the parent when assigning a leaf; the channel rolls parents up automatically
3. In Ghost Admin, create tags with those `sec-…` slugs and human display names (**Campus**); type `sec-` in the tag picker to filter
4. Extra public tags = topics; internal `#…` tags = features

### URL examples

| First tag | Post URL | Also listed on |
|-----------|----------|----------------|
| `sec-news-campus-asuc` | `/news/campus/asuc/my-story/` | `/news/campus/asuc/`, `/news/campus/`, `/news/` |
| `sec-news-campus` | `/news/campus/my-story/` | `/news/campus/`, `/news/` |
| `sec-news` | `/news/my-story/` | `/news/` |
| *(none / other)* | `/article/my-story/` | `/article/` |

Parent landings roll up with a channel filter on **primary tags**, e.g.
`primary_tag:[sec-news,sec-news-campus,sec-news-campus-asuc,…]` — no secondary
parent tag required.

### Routing mechanics

A node with children is a **channel** (rolls up descendants); a leaf is a
**collection** (owns permalinks + index). A non-leaf node's own posts still need
a permalink, but its public path is already the channel index — so a hidden
`/_/…/` collection owns them:

| Path | Type | Why |
|------|------|-----|
| `/news/` | Channel | Nice desk URL + lists all descendant primary tags |
| `/_/news/` | Hidden collection | Owns permalinks for `sec-news` posts at `/news/{slug}/` |
| `/news/campus/` | Channel | Campus has children (ASUC, …) → rolls them up |
| `/_/news/campus/` | Hidden collection | Owns `sec-news-campus` posts at `/news/campus/{slug}/` |
| `/news/campus/asuc/` | Collection | Leaf index + owns `/news/campus/asuc/{slug}/` |
| `/article/` | Collection | Catch-all: `primary_tag:-[all sec-* tags]`, listed last |

### Card / topper category label

`partials/category-label.hbs` → generated `sections/dist/category-link.hbs`
maps a post's `primary_tag` slug to its section path (not `/tag/sec-…/`).

### Redirects (generated)

- `^/_/(.*?)/?$ → /$1/` — unwraps any hidden `/_/…` index at arbitrary depth
- `^/tag/<slug>/?$ → <path>` — one per section, sending `/tag/sec-news-campus/` → `/news/campus/`

> A single or per-depth regex can't recover slug→path boundaries because
> segment ids may contain hyphens (`how-to`, `local-guides`), so each section
> gets one explicit (auto-generated) redirect.

### Legacy URL migration (handwritten)

`redirects-default.yaml` keeps the full category path + slug and strips the
old bogus `article_*.html`:

```
^/(.*/)?([^/]+)/article_[^/]+\.html$ → /$1$2/
# /news/campus/some-story/article_12345.html → /news/campus/some-story/
```

---

## Path → template → data

### Section landings

| Template | Use |
|----------|-----|
| `section-parent.hbs` | Non-leaf channels — header, subsection subnav, rolled-up posts |
| `section.hbs` | Leaf + hidden-parent collections — header + that node's posts |

Both receive `tag` from `data: tag.sec-…` in routes.

### Single posts (`post.hbs`)

Same template; the URL comes from whichever collection owns the post's primary tag.

### Ghost Pages

`page.hbs`, `custom-authors.hbs`, `custom-tags.hbs`, `custom-newsletters.hbs` — unchanged.

---

## Expanding sections

1. Add a node (and children) to `sections/data/sections.js` with the correct `sec-…` slug
2. Run `npm run build` (validation throws if a slug doesn't match its ancestry)
3. Create matching `sec-*` tags in Ghost Admin
4. Reload routes/redirects in Ghost if needed

---

## Mental model

```
Post primary_tag: sec-news-campus-asuc
        │
        ├─► collection /news/campus/asuc/  → URL /news/campus/asuc/{slug}/
        └─► also appears on channels /news/campus/ and /news/

Post primary_tag: sec-news
        │
        ├─► hidden collection /_/news/  → URL /news/{slug}/
        └─► also appears on channel /news/

Post with no sec-* tag
        │
        └─► catch-all collection /article/  → URL /article/{slug}/
```
