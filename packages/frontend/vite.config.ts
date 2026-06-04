import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const nodeFetchBrowserStub = {
  name: 'node-fetch-browser-stub',
  enforce: 'pre' as const,
  resolveId(id: string) {
    if (id === 'node-fetch' || id.startsWith('node-fetch/')) {
      return '\0node-fetch-stub';
    }
  },
  load(id: string) {
    if (id === '\0node-fetch-stub') {
      return [
        'const f = globalThis.fetch.bind(globalThis);',
        'export default f;',
        'export const Headers = globalThis.Headers;',
        'export const Request = globalThis.Request;',
        'export const Response = globalThis.Response;',
        'export const FetchError = class FetchError extends Error {};',
      ].join('\n');
    }
  },
};

export default defineConfig({
  plugins: [nodeFetchBrowserStub, react()],
  resolve: {
    alias: {
      // Redirect zod/v3 to our shim (re-exports from installed zod v3).
      // Fixes TDZ crash caused by zod-to-json-schema importing a non-existent subpath.
      'zod/v3': path.resolve(__dirname, 'src/lib/zod-v3-shim.ts'),
    },
  },
  optimizeDeps: {
    include: ['zod'],
    exclude: ['node-fetch', '@segment/analytics-node'],
  },
  build: {
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
