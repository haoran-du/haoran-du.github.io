import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFile(path.join(root, file), 'utf8');
const config = JSON.parse(await read('site/config.json'));
const publications = JSON.parse(await read('publications.json')).sort((a, b) => b.year - a.year);
const layout = await read('site/layout.html');
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const doi = (value = '') => {
  const clean = value.trim().replace(/^doi:\s*/i, '').replace(/^https?:\/\/doi\.org\//i, '');
  return clean ? `https://doi.org/${clean}` : '';
};
const title = (pub) => pub.doi ? `<a href="${escape(doi(pub.doi))}">${escape(pub.title)}</a>` : escape(pub.title);
const papers = publications.map((pub) => `<article class="publication" data-year="${escape(pub.year)}">
  <div class="record-date">${escape(pub.year)}${pub.status ? `<span class="publication-status">${escape(pub.status)}</span>` : ''}</div>
  ${pub.image ? `<img class="publication-image" src="${escape(pub.image)}" alt="Figure accompanying ${escape(pub.title)}" loading="lazy" width="180" height="145">` : '<div aria-hidden="true"></div>'}
  <div><h3>${title(pub)}</h3><p>${escape(pub.authors)}</p><p class="venue">${escape(pub.venue)}</p>${pub.doi ? `<a class="doi" href="${escape(doi(pub.doi))}">DOI: ${escape(pub.doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, ''))} <span aria-hidden="true">↗</span></a>` : ''}${pub.note ? `<p>${escape(pub.note)}</p>` : ''}</div>
</article>`).join('\n');
const recent = publications.slice(0, 2).map((pub) => `<article class="recent-paper"><p class="record-date">${escape(pub.year)}</p><div><h3>${title(pub)}</h3><p>${escape(pub.authors)} · <em>${escape(pub.venue)}</em></p></div></article>`).join('\n');
let stale = false;
const files = new Set();
const ids = new Set();
for (const page of config.pages) {
  if (!/^[a-z][a-z0-9-]*\.html$/.test(page.file) || !/^[a-z][a-z0-9-]*$/.test(page.id)) throw new Error(`Invalid page path: ${page.file}`);
  if (files.has(page.file) || ids.has(page.id)) throw new Error(`Duplicate page: ${page.id}`);
  files.add(page.file); ids.add(page.id);
  const tokens = {
    ...Object.fromEntries(Object.entries(config).filter(([, value]) => typeof value === 'string').map(([key, value]) => [`site.${key}`, escape(value)])),
    ...Object.fromEntries(Object.entries(page).map(([key, value]) => [`page.${key}`, escape(value)])),
    'page.canonical': escape(`${config.url.replace(/\/$/, '')}/${page.file === 'index.html' ? '' : page.file}`),
    navigation: config.pages.map((item) => `<a href="${escape(item.file)}"${item.id === page.id ? ' aria-current="page"' : ''}>${escape(item.label)}</a>`).join('\n'),
    publications: papers,
    'recent-publications': recent,
    'publication-years': [...new Set(publications.map((pub) => pub.year))].map((year) => `<option value="${escape(year)}">${escape(year)}</option>`).join('')
  };
  const render = (template) => template.replace(/\{\{([\w.-]+)\}\}/g, (_, key) => {
    if (!(key in tokens)) throw new Error(`Unknown template value: ${key}`);
    return tokens[key];
  });
  tokens.content = render(await read(`site/pages/${page.id}.html`));
  const html = `${render(layout).trim()}\n`;
  if (process.argv.includes('--check')) {
    const existing = await read(page.file).catch(() => '');
    if (existing.replace(/\r\n/g, '\n') !== html.replace(/\r\n/g, '\n')) { console.error(`Out of date: ${page.file}. Run npm run build.`); stale = true; }
  } else {
    await writeFile(path.join(root, page.file), html);
    console.log(`Built ${page.file}`);
  }
}
if (stale) process.exitCode = 1;
else if (process.argv.includes('--check')) console.log(`All ${config.pages.length} generated pages are up to date.`);
