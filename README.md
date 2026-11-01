# Haoran Du — research website

A responsive, multi-page academic website for GitHub Pages. Each tab has its own URL and works without JavaScript. A dependency-free Node script shares the header, footer, metadata, and publication content across pages.

## Pages

| Page | Content |
| --- | --- |
| `index.html` | Brief introduction, research interests, and research background |
| `research.html` | Research projects, figures, and methods |
| `publications.html` | Chronological journal articles and conference presentations |
| `blog.html` | Presentation slides, research notes, tutorials, and teaching materials |
| `contact.html` | Email, office, and academic profiles |

The navigation is Home, Research, Publications, Blog, Contact, and CV. The CV menu item opens the existing PDF. Old `about.html` links redirect to the background section on Home; `teaching.html` redirects to the CV. Redirects are configured alongside pages in `site/config.json`.

## Content preservation

The current CV is `assets/CV_HaoranDu_20261029.pdf`; older PDF versions have been removed from the website. The historical audit below describes the July 2026 CV used when simplifying the About and Teaching tabs:

- All five degrees, all four selected awards, and the four listed teaching courses are present in the CV.
- All five research appointments and supervisor credits remain in the Home background section; the supervisor names are absent from the CV.
- Project details, figures, methods, all four journal articles and DOI links, and all four conference presentations remain on their dedicated pages. Publication data is unchanged.
- Email, office address, and all three academic profiles remain on Contact.
- That simplification did not edit the CV PDF. At the time, source differences were not silently reconciled: the old website gave Chongqing research dates as 2017–2018, while the July CV gave January 2018–April 2019; the website also had a newer publication status for the Experiments in Fluids paper.

## Edit and preview

The header's Theme selector offers Auto, Light, and Dark. Auto is the default and follows the visitor's device-local time: light from 07:00 (inclusive) to 19:00 (exclusive), dark otherwise. Manual choices persist in local storage and sync across tabs; switching back to Auto resumes the clock. Time is checked every minute and when returning to the page. No location permission or server request is needed. `theme.js` runs before styles to apply the correct palette before first paint. Without JavaScript, the readable light palette remains available. Figure colors and the QR pattern are preserved in both themes.

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
- Edit `publications.json` to maintain the publication list. Papers are sorted by year. The existing `year`, `title`, `authors`, `venue`, `status`, `image`, `doi`, and optional `note` fields are supported. The optional `summary` field adds a short plain-language explanation below the citation. Keep summaries focused on the research question and main finding, and check them against the linked paper. The current four summaries paraphrase the publishers’ abstracts or highlights.
- Edit `style.css` for the design and `scripts.js` for optional browser enhancements.
- Add figures and CVs under `assets/`.
- Run `npm run build` after editing templates, configuration, or publication data. The root HTML files are generated; do not edit them directly.

`npm run check` verifies generated pages are current, local links/assets and section anchors resolve, navigation highlights the correct page, all publications are present in static HTML, the CV appears once per page, and legacy redirects resolve. The complete lists are served as static HTML without a runtime data fetch. The Blog has an optional category dropdown for All posts, Conference slides, Defence & exam slides, Research notes, Practical tutorials, and Teaching materials. It filters the existing list, announces the result count, and shows a message for empty categories. All posts remain readable without JavaScript. Old homepage links such as `/#research` and `/#outputs` redirect to their corresponding pages when JavaScript is enabled.

## Publish a blog post or course resource

The Blog includes slide archives for PHYSMOD 2022, 2024, and 2026, CFDSC / CSME 2025, and the 2026 comprehensive exam. Each post gets its own page and shares the site's navigation, footer, and typography. Each conference card on Publications is a single link to its matching post, with hover and keyboard-focus feedback. The posts include embedded PDF slides, open/download links, and a note directing readers to peer-reviewed journal articles for final versions of the studies. Each post header displays its title, author, and published date. Presentation posts use the presentation date as their published date for citation; the full conference dates appear separately in conference posts.

Slide PDFs are stored under `assets/slides/`. The 2024 and 2025 files use the supplied slide PDFs; PHYSMOD 2026 uses the supplied V2 PDF. The 2022 slides were exported from the supplied PowerPoint file, and the comprehensive exam slides from the V2 PowerPoint. Only PDFs are included in the website. Preserve the presentation-version note when adding further slide archives, and distinguish related journal papers from a final article covering the same study. The author has clarified that the actual PHYSMOD 2024 talk presented the POD-LSE precursor to the 2026 Experiments in Fluids paper, rather than the scheduled SPOD work; preserve that distinction in the post.

1. Write the article body in `site/posts/<slug>.html`. Use paragraphs, `h2`/`h3` headings, figures, lists, and code blocks as needed. The template supplies the `h1`, author, published date, summary, and category. The optional `author` field defaults to the site owner's name. Store figures or downloadable course materials under `assets/`; link to them as `assets/...` because generated articles live at the site root.
2. Add a record to `site/posts.json`, using the presentation date for conference, defence, and exam posts and the actual publication date for other posts. For example:

   ```json
   {
     "slug": "boundary-layer-notes",
     "title": "Boundary-layer notes",
     "author": "Haoran Du",
     "date": "2026-10-29",
     "category": "Course material",
     "summary": "A short introduction to the topic covered in this post."
   }
   ```

3. Run `npm run build` and `npm run check`, then preview. The example produces `blog-boundary-layer-notes.html` and a link on `blog.html`. Posts appear newest first. Use `Conference presentation`, `Defence or exam`, `Research note`, `Tutorial`, or `Course material` for the standard filter categories; another descriptive category is automatically added to the dropdown.
4. Commit the content, metadata, and generated pages together. Every entry is included in the build; there is no draft or scheduling mode. To retire a post, remove its metadata and generated HTML together, then rebuild.

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

Use the same pattern for News, Resources, or Opportunities when real content is available. To adopt a group identity, update the shared `name`, `tagline`, and contact values in `site/config.json`, revise each page's title/description, and update the homepage, biography, portrait, social-preview image, and favicon. Academic background can move into a member biography. Existing research and publication pages remain reusable.
