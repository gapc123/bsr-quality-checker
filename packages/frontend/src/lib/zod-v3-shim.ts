// Shim for zod/v3 — re-exports the installed zod package.
// zod-to-json-schema (a CopilotKit dep) imports 'zod/v3' which only exists in zod v4.
// This shim redirects that import to the installed zod v3, fixing the TDZ crash.
export * from 'zod';
export { default } from 'zod';
