import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { getIconData, iconToSVG } from '@iconify/utils';

const SOURCE_EXTENSIONS = new Set(['.vue', '.js', '.jsx', '.ts', '.tsx', '.html']);
const ICON_NAME = '[a-z0-9][a-z0-9-]*';

export const defaults = Object.freeze({
  prefix: 'icon',
  component: 'Icon',
  source: ['src'],
  cssFile: 'src/icon-forge.css',
  iconSource: 'api',
  apiUrl: 'https://api.iconify.design/',
  cacheDir: '.icon-forge/cache',
  offline: false,
});

export function normalizeOptions(options = {}) {
  const definedOptions = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
  const result = { ...defaults, ...definedOptions };
  result.source = Array.isArray(result.source) ? result.source : [result.source];
  if (!/^[a-z][a-z0-9-]*$/.test(result.prefix)) throw new Error('icon-forge: "prefix" must use lowercase letters, digits or hyphens.');
  if (!/^[A-Z][A-Za-z0-9]*$/.test(result.component)) throw new Error('icon-forge: "component" must be a PascalCase name.');
  if (!['api', 'local'].includes(result.iconSource)) throw new Error('icon-forge: "iconSource" must be "api" or "local".');
  return result;
}

function patterns(options) {
  const p = options.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const c = options.component.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [
    new RegExp(`(?:class|className)\\s*=\\s*["'][^"']*?(${p}:(${ICON_NAME}):(${ICON_NAME}))(?:\\s|["'])`, 'g'),
    new RegExp(`<${c}\\b[^>]*?\\bname\\s*=\\s*["']((${ICON_NAME}):(${ICON_NAME}))["'][^>]*>`, 'g'),
  ];
}

export function scanText(text, options = {}) {
  const config = normalizeOptions(options);
  const found = new Set();
  for (const regex of patterns(config)) {
    regex.lastIndex = 0;
    for (let match; (match = regex.exec(text));) {
      const value = match[1];
      // Class references include the configured prefix; component references do not.
      found.add(value.startsWith(`${config.prefix}:`) ? value.slice(config.prefix.length + 1) : value);
    }
  }
  return found;
}

async function walk(directory, files = []) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return files; }
  for (const entry of entries) {
    const target = join(directory, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.git'].includes(entry.name)) await walk(target, files);
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(target);
  }
  return files;
}

export async function scanProject(root, options = {}) {
  const config = normalizeOptions(options);
  const files = (await Promise.all(config.source.map((item) => walk(join(root, item)))).then((groups) => groups.flat()));
  const icons = new Set();
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const icon of scanText(text, config)) icons.add(icon);
  }
  return { icons, files };
}

function mergeCollection(existing, incoming) {
  const merged = { ...existing, ...incoming };
  for (const key of ['icons', 'aliases', 'chars']) merged[key] = { ...(existing?.[key] || {}), ...(incoming?.[key] || {}) };
  return merged;
}

async function readCache(filename) {
  try { return JSON.parse(await readFile(filename, 'utf8')); } catch { return null; }
}

async function loadLocalSet(prefix, root) {
  const require = createRequire(join(root, 'package.json'));
  let filename;
  try { filename = require.resolve(`@iconify/json/json/${prefix}.json`); }
  catch { throw new Error('icon-forge: local icon data is not installed. Run: npm install -D @iconify/json'); }
  return JSON.parse(await readFile(filename, 'utf8'));
}

async function loadApiSet(prefix, names, config, root) {
  const filename = join(root, config.cacheDir, `${prefix}.json`);
  let collection = await readCache(filename);
  const missing = names.filter((name) => !collection || !getIconData(collection, name));
  if (!missing.length) return collection;
  if (config.offline) throw new Error(`icon-forge: ${prefix}:${missing.join(', ')} is not in the local cache and "offline" is enabled.`);

  const url = new URL(`${prefix}.json`, config.apiUrl);
  url.searchParams.set('icons', missing.join(','));
  const response = await (config.fetch || globalThis.fetch)(url);
  if (!response?.ok) throw new Error(`icon-forge: Iconify API request failed for "${prefix}" (${response?.status || 'network error'}).`);
  const incoming = await response.json();
  collection = mergeCollection(collection, incoming);
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, `${JSON.stringify(collection)}\n`, 'utf8');
  return collection;
}

async function loadSet(prefix, names, config, root) {
  return config.iconSource === 'local'
    ? loadLocalSet(prefix, root)
    : loadApiSet(prefix, names, config, root);
}

function svgDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, ' ')}`;
}

export async function generateCss(iconNames, options = {}, root = process.cwd()) {
  const config = normalizeOptions(options);
  const bySet = new Map();
  for (const icon of iconNames) {
    const [set, ...parts] = icon.split(':');
    const name = parts.join(':');
    if (!set || !name) throw new Error(`icon-forge: invalid icon name "${icon}". Use "set:name".`);
    if (!bySet.has(set)) bySet.set(set, []);
    bySet.get(set).push(name);
  }
  const rules = [];
  for (const [set, names] of bySet) {
    const collection = await loadSet(set, names, config, root);
    for (const name of new Set(names)) {
      const data = getIconData(collection, name);
      if (!data) throw new Error(`icon-forge: icon "${set}:${name}" was not found.`);
      const rendered = iconToSVG(data, { height: 'auto' });
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${rendered.attributes.viewBox}">${rendered.body}</svg>`;
      const className = `${config.prefix}:${set}:${name}`.replace(/:/g, '\\:');
      const uri = svgDataUri(svg);
      rules.push(`.${className}{display:inline-block;width:1em;height:1em;vertical-align:-0.125em;background-color:currentColor;mask: url("${uri}") center/contain no-repeat;-webkit-mask:url("${uri}") center/contain no-repeat;}`);
    }
  }
  return `/* Generated by icon-forge. Do not edit. */\n${rules.join('\n')}\n`;
}

export async function forge(root, options = {}) {
  const config = normalizeOptions(options);
  const { icons, files } = await scanProject(root, config);
  const css = await generateCss(icons, config, root);
  const destination = join(root, config.cssFile);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, css, 'utf8');
  return { icons: [...icons].sort(), files: files.map((file) => relative(root, file)), cssFile: destination };
}

export const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
