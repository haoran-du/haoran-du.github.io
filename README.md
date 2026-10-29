# Haoran Du — research website

A responsive, multi-page academic website for GitHub Pages. Each tab has its own URL and works without JavaScript. A dependency-free Node script shares the header, footer, metadata, and publication content across pages.

## Pages

| Page | Content |
| --- | --- |
| `index.html` | Research overview, portrait, ongoing projects, recent papers |
| `research.html` | Research projects, figures, and methods |
| `publications.html` | Journal papers, optional search/year filters, presentations |
| `teaching.html` | Teaching assistant experience |
| `about.html` | Biography, education, appointments, and awards |
| `contact.html` | Email, office, and academic profiles |

## Edit and preview

Use Node.js 20 or later. No package installation is needed.

```sh
npm run build
npm run check
npm run preview
```

Open `http://127.0.0.1:4173`. Stop the preview with Ctrl+C.

- Edit page content in `site/pages/*.html`.
- Edit shared identity, contact details, CV path, and navigation in `site/config.json`.
- Edit the shared header/footer in `site/layout.html`.
- Edit `publications.json` to maintain the publication list. Papers are sorted by year; the latest two also appear on the homepage. The existing `year`, `title`, `authors`, `venue`, `status`, `image`, `doi`, and optional `note` fields are supported.
- Edit `style.css` for the design and `scripts.js` for optional browser enhancements.
- Add figures and CVs under `assets/`.
- Run `npm run build` after editing templates, configuration, or publication data. The root HTML files are generated; do not edit them directly.

`npm run check` verifies generated pages are current, local links/assets and section anchors resolve, navigation highlights the correct page, and all publications are present in static HTML. Publication filtering adds no runtime data-fetch dependency. Old homepage links such as `/#research` and `/#outputs` redirect to their corresponding pages when JavaScript is enabled.

## GitHub Pages

Commit the generated root HTML files alongside their source changes. Keep the repository's existing GitHub Pages deployment configuration; this site needs no server or build service. The root `.nojekyll` file allows the prebuilt files to be served directly. If configuring Pages for the first time, use the `main` branch and `/ (root)` directory. Push reviewed changes to that publishing branch to update the live website.

## Grow into a group website

The shared layout and page configuration allow new sections without rebuilding the site structure. The current public pages describe Haoran's individual research; no group membership or recruitment status is implied.

To add a People page when a group is established:

1. Create `site/pages/people.html` with a single `h1`, using the existing page templates as a guide. Include verified member names, roles, bios, and portraits.
2. Add an entry to the `pages` array in `site/config.json`:

   ```json
   {
     "id": "people",
     "label": "People",
     "file": "people.html",
     "title": "People | Group name",
     "description": "Members of the research group."
   }
   ```

3. Run `npm run build` and `npm run check`. The new page automatically appears in every navigation bar and has its own active state.

Use the same pattern for News, Resources, or Opportunities when real content is available. To adopt a group identity, update the shared `name`, `tagline`, and contact values in `site/config.json`, revise each page's title/description, and update the homepage, biography, portrait, social-preview image, and favicon. Personal education and appointments can move into a member biography. Existing research and publication pages remain reusable.
