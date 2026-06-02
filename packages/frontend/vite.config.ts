import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
      'zod/v3': 'zod',
    },
  },
  optimizeDeps: {
    include: ['zod', '@copilotkit/react-core', '@copilotkit/react-ui'],
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
