import type { Plugin } from 'vite';
import type { IconForgeOptions } from './core.js';

/** Creates the Vite plugin that scans icon usage and provides generated CSS. */
export function iconForge(options?: IconForgeOptions): Plugin;
