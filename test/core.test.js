import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateCss, scanText } from '../src/core.js';
import { iconForge } from '../src/vite.js';
import { resolveSize } from '../src/size.js';

test('finds static Vue Icon component names', () => {
  const icons = scanText('<Icon name="mdi:plus" /><Icon name="ph:gear-six" />');
  assert.deepEqual([...icons].sort(), ['mdi:plus', 'ph:gear-six']);
});

test('finds configured class references', () => {
  const icons = scanText('<i class="button xxx:mdi:close"></i>', { prefix: 'xxx' });
  assert.deepEqual([...icons], ['mdi:close']);
});

test('does not find dynamic icon names', () => {
  assert.equal(scanText('<Icon :name="currentIcon" />').size, 0);
});

test('normalizes named, numeric and CSS icon sizes', () => {
  assert.equal(resolveSize('sm'), '1em');
  assert.equal(resolveSize('lg'), '1.5em');
  assert.equal(resolveSize(16), '16px');
  assert.equal(resolveSize('24'), '24px');
  assert.equal(resolveSize('24em'), '24em');
});

test('Vite plugin auto-imports the Vue component and stylesheet', () => {
  const plugin = iconForge();
  const result = plugin.transform('<template><Icon name="mdi:plus" /></template>', 'App.vue');
  assert.match(result.code, /import \{ Icon as IconForgeIcon \} from 'icon-forge\/vue';/);
  assert.match(result.code, /<IconForgeIcon prefix="icon" name="mdi:plus"/);
  assert.match(result.code, /import 'virtual:icon-forge\.css';/);
});

test('API source downloads only requested icons and caches the response', async () => {
  const root = await mkdtemp(join(tmpdir(), 'icon-forge-test-'));
  let requests = 0;
  const fetch = async (url) => {
    requests += 1;
    assert.equal(url.toString(), 'https://api.iconify.design/mdi.json?icons=plus');
    return {
      ok: true,
      json: async () => ({ prefix: 'mdi', width: 24, height: 24, icons: { plus: { body: '<path d="M0 0h24v24"/>' } } }),
    };
  };
  const options = { fetch, cacheDir: '.test-cache' };
  const css = await generateCss(['mdi:plus'], options, root);
  await generateCss(['mdi:plus'], options, root);
  assert.match(css, /icon\\:mdi\\:plus/);
  assert.equal(requests, 1);
});
