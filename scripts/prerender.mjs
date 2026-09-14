// Runs after the client + SSR builds. This app's SSR render ignores the URL
// and has no per-request data (see src/entry-server.tsx), so instead of
// running a render on every request in production, bake the rendered HTML
// into dist/client/index.html once here. That makes the deployed site plain
// static output — no Node server required to serve pages, just the one
// /api/estimate function for the form.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const clientHtmlPath = join(root, 'dist/client/index.html');
const serverEntryPath = join(root, 'dist/server/entry-server.js');

const template = await readFile(clientHtmlPath, 'utf-8');
const { render } = await import(serverEntryPath);
const appHtml = await render();
const html = template.replace('<!--app-html-->', () => appHtml);

await writeFile(clientHtmlPath, html);
console.log('prerendered dist/client/index.html');
