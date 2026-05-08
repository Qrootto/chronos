import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        tokens:     resolve(__dirname, 'tokens.html'),
        components: resolve(__dirname, 'components.html'),
        privacy:    resolve(__dirname, 'privacy.html'),
      },
    },
  },
  server: {
    open: true,
  },
});
