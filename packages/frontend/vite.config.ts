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
      // zod-to-json-schema (CopilotKit dep) imports 'zod/v3' which only exists in zod v4.
      // This alias ensures it always resolves to whatever zod is installed,
      // preventing Rollup from creating an uninitialised binding → TDZ crash.
      'zod/v3': 'zod',
    },
  },
  optimizeDeps: {
    include: ['zod', '@copilotkit/react-core', '@copilotkit/react-ui'],
    exclude: ['node-fetch', '@segment/analytics-node'],
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
