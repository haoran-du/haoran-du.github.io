import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFile(path.join(root, file), 'utf8');
const config = JSON.parse(await read('site/config.json'));
const publications = JSON.parse(await read('publications.json')).sort((a, b) => b.year - a.year);
const posts = JSON.parse(await read('site/posts.json'));
if (!Array.isArray(posts)) throw new Error('site/posts.json must contain an array');
const slugs = new Set();
for (const post of posts) {
  if (!/^[a-z][a-z0-9-]*$/.test(post.slug) || slugs.has(post.slug)) throw new Error(`Invalid or duplicate post slug: ${post.slug}`);
  if (!post.title?.trim() || !post.summary?.trim()) throw new Error(`Missing title or summary for post: ${post.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date) || new Date(`${post.date}T00:00:00Z`).toISOString().slice(0, 10) !== post.date) throw new Error(`Invalid post date: ${post.slug}`);
  slugs.add(post.slug);
}
posts.sort((a, b) => b.date.localeCompare(a.date));
const dateLabel = (date) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
const layout = await read('site/layout.html');
// Change asset URLs when their content changes so cached Pages styles stay current.
const assetUrl = async (file) => `${file}?v=${createHash('sha256').update((await read(file)).replace(/\r\n/g, '\n')).digest('hex').slice(0, 12)}`;
const assets = { 'asset.stylesheet': await assetUrl('style.css'), 'asset.script': await assetUrl('scripts.js'), 'asset.theme': await assetUrl('theme.js') };
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const doi = (value = '') => {
  const clean = value.trim().replace(/^doi:\s*/i, '').replace(/^https?:\/\/doi\.org\//i, '');
  return clean ? `https://doi.org/${clean}` : '';
};
const papers = publications.map((pub) => `<article class="publication" data-year="${escape(pub.year)}">
  <div class="record-date">${escape(pub.year)}${pub.status && pub.status.toLowerCase() !== 'published' ? `<span class="publication-status">${escape(pub.status)}</span>` : ''}</div>
  ${pub.image ? `<img class="publication-image" src="${escape(pub.image)}" alt="Figure accompanying ${escape(pub.title)}" loading="lazy" width="300" height="225">` : '<div aria-hidden="true"></div>'}
  <div><h3>${escape(pub.title)}</h3><p>${escape(pub.authors)}</p><p class="venue">${escape(pub.venue)}</p>${pub.summary ? `<p class="publication-summary">${escape(pub.summary)}</p>` : ''}${pub.doi ? `<a class="doi" href="${escape(doi(pub.doi))}">DOI: ${escape(pub.doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, ''))} <span aria-hidden="true">↗</span></a>` : ''}${pub.note ? `<p>${escape(pub.note)}</p>` : ''}</div>
</article>`).join('\n');
const postCategories = new Map([
  ['Conference presentation', 'Conference slides'],
  ['Defence or exam', 'Defence & exam slides'],
  ['Research note', 'Research notes'],
  ['Tutorial', 'Practical tutorials'],
  ['Course material', 'Teaching materials']
]);
for (const post of posts) {
  const category = post.category || 'Note';
  if (!postCategories.has(category)) postCategories.set(category, category);
}
const postFilters = [...postCategories].map(([value, label]) => `<option value="${escape(value)}">${escape(label)}</option>`).join('\n');
const postList = posts.length ? posts.map((post) => `<article class="blog-entry" data-category="${escape(post.category || 'Note')}">
  <div class="post-meta"><span>${escape(post.category || 'Note')}</span><time datetime="${escape(post.date)}">${dateLabel(post.date)}</time></div>
  <div><h3><a href="blog-${escape(post.slug)}.html">${escape(post.title)}</a></h3><p>${escape(post.summary)}</p></div>
</article>`).join('\n') : '<p class="blog-empty">No posts published yet. Research notes and course materials will appear here as they become available.</p>';
let stale = false;
const files = new Set();
const ids = new Set();
async function output(file, html) {
  if (process.argv.includes('--check')) {
    const existing = await read(file).catch(() => '');
    if (existing.replace(/\r\n/g, '\n') !== html.replace(/\r\n/g, '\n')) {
      console.error(`Out of date: ${file}. Run npm run build.`);
      stale = true;
    }
  } else {
    await writeFile(path.join(root, file), html);
    console.log(`Built ${file}`);
  }
}
async function buildPage(page, content, extra = {}) {
  if (!/^[a-z][a-z0-9-]*\.html$/.test(page.file) || !/^[a-z][a-z0-9-]*$/.test(page.id)) throw new Error(`Invalid page path: ${page.file}`);
  if (files.has(page.file)) throw new Error(`Duplicate page file: ${page.file}`);
  files.add(page.file);
  const tokens = {
    ...assets,
    ...Object.fromEntries(Object.entries(config).filter(([, value]) => typeof value === 'string').map(([key, value]) => [`site.${key}`, escape(value)])),
    ...Object.fromEntries(Object.entries(page).map(([key, value]) => [`page.${key}`, escape(value)])),
    'page.canonical': escape(`${config.url.replace(/\/$/, '')}/${page.file === 'index.html' ? '' : page.file}`),
    navigation: config.pages.map((item) => `<a href="${escape(item.file)}"${item.id === page.id ? ' aria-current="page"' : ''}>${escape(item.label)}</a>`).join('\n'),
    publications: papers,
    posts: postList,
    postFilters,
    ...extra
  };
  const render = (template) => template.replace(/\{\{([\w.-]+)\}\}/g, (_, key) => {
    if (!(key in tokens)) throw new Error(`Unknown template value: ${key}`);
    return tokens[key];
  });
  tokens.content = render(content);
  await output(page.file, `${render(layout).trim()}\n`);
}
for (const page of config.pages) {
  if (ids.has(page.id)) throw new Error(`Duplicate page: ${page.id}`);
  ids.add(page.id);
  await buildPage(page, await read(`site/pages/${page.id}.html`));
}
for (const post of posts) {
  await buildPage({ id: 'blog', file: `blog-${post.slug}.html`, title: `${post.title} | ${config.name}`, description: post.summary }, await read('site/post.html'), {
    'post.title': escape(post.title),
    'post.author': escape(post.author || config.name),
    'post.summary': escape(post.summary),
    'post.category': escape(post.category || 'Note'),
    'post.date': escape(post.date),
    'post.dateLabel': dateLabel(post.date),
    'post.content': await read(`site/posts/${post.slug}.html`)
  });
}
// Keep existing bookmarks useful after a page is consolidated.
for (const redirect of config.redirects ?? []) {
  if (!/^[a-z][a-z0-9-]*\.html$/.test(redirect.file) || files.has(redirect.file)) throw new Error(`Invalid redirect path: ${redirect.file}`);
  files.add(redirect.file);
  const target = redirect.target === 'cv' ? config.cv : redirect.target;
  const canonical = new URL(target, `${config.url}/`).href;
  await output(redirect.file, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(redirect.label)} | ${escape(config.name)}</title>
  <meta http-equiv="refresh" content="0; url=${escape(target)}">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${escape(canonical)}">
</head>
<body><p>This content has moved. <a href="${escape(target)}">${escape(redirect.label)}</a>.</p></body>
</html>
`);
}
if (stale) process.exitCode = 1;
else if (process.argv.includes('--check')) console.log(`All ${config.pages.length} pages, ${posts.length} blog posts, and ${(config.redirects ?? []).length} redirects are up to date.`);
