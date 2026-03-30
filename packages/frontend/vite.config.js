import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @copilotkit/shared → @segment/analytics-node → node-fetch pulls in Node.js
// built-ins (https, http, stream…) that Vite can't bundle for the browser.
// This pre-plugin stubs node-fetch with browser-native fetch before Rollup's
// CommonJS resolver can process the real package.
var nodeFetchBrowserStub = {
    name: 'node-fetch-browser-stub',
    enforce: 'pre',
    resolveId: function (id) {
        if (id === 'node-fetch' || id.startsWith('node-fetch/')) {
            return '\0node-fetch-stub';
        }
    },
    load: function (id) {
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
    optimizeDeps: {
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
