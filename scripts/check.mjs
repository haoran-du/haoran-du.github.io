import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'site/config.json'), 'utf8'));
const publications = JSON.parse(await readFile(path.join(root, 'publications.json'), 'utf8'));
const pages = new Map(await Promise.all(config.pages.map(async (page) => [page.file, await readFile(path.join(root, page.file), 'utf8')])));
let links = 0;
for (const [file, html] of pages) {
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, `${file}: expected one h1`);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1, `${file}: expected one current navigation link`);
  assert(html.includes(`href="${file}" aria-current="page"`), `${file}: incorrect active navigation`);
  assert.equal(html.split(`href="${config.cv}"`).length - 1, 1, `${file}: CV should appear only once`);
  assert(!html.includes('{{'), `${file}: unresolved template token`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate element IDs`);
  for (const image of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]*"/.test(image[0]), `${file}: image missing alt`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(?:https?:|mailto:|data:)/.test(url)) continue;
    const [targetFile, hash] = url.split('#');
    const target = targetFile.split('?')[0] || file;
    assert((await stat(path.join(root, target))).isFile(), `${file}: missing target ${target}`);
    if (hash) assert(pages.get(target)?.includes(`id="${hash}"`), `${file}: missing anchor ${url}`);
    links++;
  }
}
const papersPage = pages.get('publications.html');
assert.equal((papersPage.match(/class="publication"/g) ?? []).length, publications.length, 'Every publication must be included in static HTML');
for (const pub of publications) assert(papersPage.includes(pub.doi), `Missing DOI: ${pub.doi}`);
for (const redirect of config.redirects ?? []) {
  const target = redirect.target === 'cv' ? config.cv : redirect.target;
  const html = await readFile(path.join(root, redirect.file), 'utf8');
  assert(html.includes(`content="0; url=${target}"`), `Incorrect redirect: ${redirect.file}`);
  const [file, hash] = target.split('#');
  assert((await stat(path.join(root, file))).isFile(), `Missing redirect destination: ${file}`);
  if (hash) assert(pages.get(file)?.includes(`id="${hash}"`), `Missing redirect anchor: ${target}`);
}
console.log(`Verified ${pages.size} pages, ${links} local links/assets, ${publications.length} publications, and ${(config.redirects ?? []).length} redirects.`);
