import { scanProject, scanText, generateCss, normalizeOptions } from './core.js';

const CSS_ID = '\0virtual:icon-forge.css';
const PUBLIC_CSS_ID = 'virtual:icon-forge.css';

function hasComponent(code, component) {
  return new RegExp(`<${component}\\b`).test(code);
}

function injectVueComponent(code, component, prefix) {
  if (!hasComponent(code, component)) return code;
  // Vue only treats PascalCase tags as components. Leading underscores make the
  // compiler preserve the tag as an unknown HTML element.
  const local = 'IconForgeIcon';
  const open = new RegExp(`<${component}(\\s|>)`, 'g');
  const close = new RegExp(`</${component}>`, 'g');
  let transformed = code
    .replace(open, `<${local} prefix="${prefix}"$1`)
    .replace(close, `</${local}>`);
  const imports = [
    `import { Icon as ${local} } from '@acmepy/icon-forge/vue';`,
    `import '${PUBLIC_CSS_ID}';`,
  ].filter((line) => !transformed.includes(line)).join('\n');
  if (imports) {
    const setup = transformed.match(/<script\s+setup(?:\s[^>]*)?>/);
    if (setup) transformed = `${transformed.slice(0, setup.index + setup[0].length)}\n${imports}${transformed.slice(setup.index + setup[0].length)}`;
    else transformed = `<script setup>\n${imports}\n</script>\n${transformed}`;
  }
  return transformed;
}

/**
 * Vite integration. It auto-imports <Icon name="set:name"/> in Vue SFCs and
 * supplies a virtual stylesheet containing only icons referenced by the project.
 */
export function iconForge(options = {}) {
  const config = normalizeOptions(options);
  let root;
  let server;
  let icons = new Set();

  async function refresh() {
    const result = await scanProject(root, config);
    icons = result.icons;
  }
  function invalidateCss() {
    const module = server?.moduleGraph.getModuleById(CSS_ID);
    if (module) server.moduleGraph.invalidateModule(module);
  }

  return {
    name: 'icon-forge',
    enforce: 'pre',
    configResolved(resolved) { root = resolved.root; },
    async buildStart() { await refresh(); },
    configureServer(devServer) {
      server = devServer;
      devServer.watcher.on('change', async (file) => {
        if (/\.(vue|[cm]?[jt]sx?|html)$/.test(file)) {
          await refresh();
          invalidateCss();
        }
      });
    },
    resolveId(id) { return id === PUBLIC_CSS_ID ? CSS_ID : null; },
    async load(id) {
      if (id !== CSS_ID) return null;
      return generateCss(icons, config, root);
    },
    transform(code, id) {
      if (!id.endsWith('.vue') || !hasComponent(code, config.component)) return null;
      for (const icon of scanText(code, config)) icons.add(icon);
      const transformed = injectVueComponent(code, config.component, config.prefix);
      return { code: transformed, map: null };
    },
  };
}
