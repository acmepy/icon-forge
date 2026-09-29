export interface IconForgeOptions {
  /** CSS class prefix used for generated icon rules. */
  prefix?: string;
  /** Vue component name to scan for. */
  component?: string;
  /** Directories, relative to the project root, to scan. */
  source?: string | string[];
  /** Path, relative to the project root, where the CLI writes CSS. */
  cssFile?: string;
  /** Load icon data from the Iconify API or a local @iconify/json install. */
  iconSource?: 'api' | 'local';
  /** Base URL for the Iconify API. */
  apiUrl?: string;
  /** Directory, relative to the project root, for cached API responses. */
  cacheDir?: string;
  /** Do not make API requests when an icon is missing from the cache. */
  offline?: boolean;
  /** Custom fetch implementation, primarily useful for testing. */
  fetch?: typeof globalThis.fetch;
}

export interface ResolvedIconForgeOptions extends Required<Omit<IconForgeOptions, 'source' | 'fetch'>> {
  source: string[];
  fetch?: typeof globalThis.fetch;
}

export interface ScanProjectResult {
  icons: Set<string>;
  files: string[];
}

export interface ForgeResult {
  icons: string[];
  files: string[];
  cssFile: string;
}

export const defaults: Readonly<Omit<ResolvedIconForgeOptions, 'fetch'>>;
export function normalizeOptions(options?: IconForgeOptions): ResolvedIconForgeOptions;
export function scanText(text: string, options?: IconForgeOptions): Set<string>;
export function scanProject(root: string, options?: IconForgeOptions): Promise<ScanProjectResult>;
export function generateCss(iconNames: Iterable<string>, options?: IconForgeOptions, root?: string): Promise<string>;
export function forge(root: string, options?: IconForgeOptions): Promise<ForgeResult>;
export const packageRoot: string;
