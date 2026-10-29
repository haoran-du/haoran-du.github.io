import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFile(path.join(root, file), 'utf8');
const config = JSON.parse(await read('site/config.json'));
const publications = JSON.parse(await read('publications.json')).sort((a, b) => b.year - a.year);
const layout = await read('site/layout.html');
// Change asset URLs when their content changes so cached Pages styles stay current.
const assetUrl = async (file) => `${file}?v=${createHash('sha256').update((await read(file)).replace(/\r\n/g, '\n')).digest('hex').slice(0, 12)}`;
const assets = { 'asset.stylesheet': await assetUrl('style.css'), 'asset.script': await assetUrl('scripts.js') };
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const doi = (value = '') => {
  const clean = value.trim().replace(/^doi:\s*/i, '').replace(/^https?:\/\/doi\.org\//i, '');
  return clean ? `https://doi.org/${clean}` : '';
};
const papers = publications.map((pub) => `<article class="publication" data-year="${escape(pub.year)}">
  <div class="record-date">${escape(pub.year)}${pub.status && pub.status.toLowerCase() !== 'published' ? `<span class="publication-status">${escape(pub.status)}</span>` : ''}</div>
  ${pub.image ? `<img class="publication-image" src="${escape(pub.image)}" alt="Figure accompanying ${escape(pub.title)}" loading="lazy" width="180" height="145">` : '<div aria-hidden="true"></div>'}
  <div><h3>${escape(pub.title)}</h3><p>${escape(pub.authors)}</p><p class="venue">${escape(pub.venue)}</p>${pub.summary ? `<p class="publication-summary">${escape(pub.summary)}</p>` : ''}${pub.doi ? `<a class="doi" href="${escape(doi(pub.doi))}">DOI: ${escape(pub.doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, ''))} <span aria-hidden="true">↗</span></a>` : ''}${pub.note ? `<p>${escape(pub.note)}</p>` : ''}</div>
</article>`).join('\n');
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
for (const page of config.pages) {
  if (!/^[a-z][a-z0-9-]*\.html$/.test(page.file) || !/^[a-z][a-z0-9-]*$/.test(page.id)) throw new Error(`Invalid page path: ${page.file}`);
  if (files.has(page.file) || ids.has(page.id)) throw new Error(`Duplicate page: ${page.id}`);
  files.add(page.file); ids.add(page.id);
  const tokens = {
    ...assets,
    ...Object.fromEntries(Object.entries(config).filter(([, value]) => typeof value === 'string').map(([key, value]) => [`site.${key}`, escape(value)])),
    ...Object.fromEntries(Object.entries(page).map(([key, value]) => [`page.${key}`, escape(value)])),
    'page.canonical': escape(`${config.url.replace(/\/$/, '')}/${page.file === 'index.html' ? '' : page.file}`),
    navigation: config.pages.map((item) => `<a href="${escape(item.file)}"${item.id === page.id ? ' aria-current="page"' : ''}>${escape(item.label)}</a>`).join('\n'),
    publications: papers
  };
  const render = (template) => template.replace(/\{\{([\w.-]+)\}\}/g, (_, key) => {
    if (!(key in tokens)) throw new Error(`Unknown template value: ${key}`);
    return tokens[key];
  });
  tokens.content = render(await read(`site/pages/${page.id}.html`));
  await output(page.file, `${render(layout).trim()}\n`);
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
else if (process.argv.includes('--check')) console.log(`All ${config.pages.length} pages and ${(config.redirects ?? []).length} redirects are up to date.`);
