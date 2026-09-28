import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { iconForge } from '@acmepy/icon-forge/vite';

export default defineConfig({
  plugins: [vue(), iconForge({ iconSource: 'api' })],
});
