import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../theme.js', import.meta.url), 'utf8');
function browser(hour, saved = null, blocked = false) {
  const storage = new Map(saved === null ? [] : [['haoran-theme', saved]]);
  const events = {};
  const callbacks = {};
  const select = { value: '', addEventListener: (name, fn) => { callbacks[name] = fn; } };
  const root = { dataset: {} };
  const control = { hidden: true };
  const meta = { setAttribute: (name, value) => { meta[name] = value; } };
  let clock = hour;
  let timer;
  const document = {
    documentElement: root, hidden: false,
    getElementById: () => select,
    querySelector: (selector) => selector === '.theme-switch' ? control : meta,
    addEventListener: (name, fn) => { events[name] = fn; }
  };
  vm.runInNewContext(source, {
    document,
    window: { addEventListener: (name, fn) => { events[name] = fn; } },
    Date: class extends Date { getHours() { return clock; } },
    localStorage: {
      getItem: (key) => { if (blocked) throw Error('Storage blocked'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (blocked) throw Error('Storage blocked'); storage.set(key, value); }
    },
    setInterval: (fn, delay) => { assert.equal(delay, 60000); timer = fn; }
  });
  return { root, storage, events, control, meta, select,
    ready: () => events.DOMContentLoaded(),
    change: (value) => { select.value = value; callbacks.change(); },
    time: (value) => { clock = value; timer(); }
  };
}

test('Auto applies local-time day/night boundaries before DOM ready', () => {
  for (const [hour, expected] of [[0,'dark'],[6,'dark'],[7,'light'],[18,'light'],[19,'dark'],[23,'dark']]) {
    const page = browser(hour);
    assert.equal(page.root.dataset.theme, expected);
    assert.equal(page.root.dataset.themeMode, 'auto');
  }
});

test('Manual choices persist across page loads and override time until Auto is selected', () => {
  const page = browser(10);
  page.ready();
  assert.equal(page.control.hidden, false);
  page.change('dark');
  assert.equal(page.storage.get('haoran-theme'), 'dark');
  page.time(12);
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(browser(12, page.storage.get('haoran-theme')).root.dataset.theme, 'dark');
  page.change('light');
  page.time(22);
  assert.equal(page.root.dataset.theme, 'light');
  page.change('auto');
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.meta.content, '#384248');
});

test('An open page follows the local clock when Auto is active', () => {
  const page = browser(18);
  page.time(19);
  assert.equal(page.root.dataset.theme, 'dark');
  page.time(7);
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.meta.content, '#efeae2');
});

test('Invalid or unavailable storage still allows automatic and manual appearance', () => {
  assert.equal(browser(12, 'invalid').root.dataset.theme, 'light');
  const page = browser(12, null, true);
  page.ready();
  page.change('dark');
  assert.equal(page.root.dataset.theme, 'dark');
});

test('Choices synchronize across tabs and are refreshed after page restoration', () => {
  const page = browser(22);
  page.ready();
  page.storage.set('haoran-theme', 'light');
  page.events.storage({ key: 'haoran-theme' });
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.select.value, 'light');
  page.storage.clear();
  page.events.storage({ key: null });
  assert.equal(page.root.dataset.themeMode, 'auto');
  assert.equal(page.root.dataset.theme, 'dark');
  page.storage.set('haoran-theme', 'light');
  page.events.pageshow();
  assert.equal(page.root.dataset.theme, 'light');
});
