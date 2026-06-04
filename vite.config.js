import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome108'
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js']
  }
});
