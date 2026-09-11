import Fastify from 'fastify';
import middie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import fs from 'node:fs/promises';

type EstimateRequestBody = {
  name?: string;
  phone?: string;
  email?: string;
  projectType?: string;
  details?: string;
  timeline?: string;
  company?: string;
};

type EstimateResponse = {
  ok: boolean;
  message: string;
};

const isProd = process.env.NODE_ENV === 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = __dirname;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const estimateRequestTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (estimateRequestTimestamps.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  estimateRequestTimestamps.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

async function createServer() {
  const app = Fastify({ logger: true });

  app.post('/api/estimate', async (request, reply) => {
    const body = (request.body ?? {}) as EstimateRequestBody;
    const { name, phone, email, projectType, details, timeline, company } = body;

    if (company) {
      const response: EstimateResponse = {
        ok: true,
        message: 'Thanks! We received your request and will call you shortly.'
      };
      return reply.send(response);
    }

    if (isRateLimited(request.ip)) {
      const response: EstimateResponse = {
        ok: false,
        message: 'Too many requests. Please try again later.'
      };
      return reply.status(429).send(response);
    }

    if (!name || !phone || !projectType || !details) {
      const response: EstimateResponse = {
        ok: false,
        message: 'Please fill in name, phone, project type, and project details.'
      };
      return reply.status(400).send(response);
    }

    app.log.info({ lead: { name, phone, email, projectType, timeline, details } }, 'New estimate request');

    const response: EstimateResponse = {
      ok: true,
      message: 'Thanks! We received your request and will call you shortly.'
    };
    return reply.send(response);
  });

  if (!isProd) {
    await app.register(middie);
    const { createServer: createViteServer } = await import('vite');

    const vite = await createViteServer({
      root,
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.get('/favicon.ico', async (_, reply) => reply.code(204).send());

    app.get('*', async (request, reply) => {
      try {
        const url = request.raw.url || '/';
        const template = await fs.readFile(join(root, 'index.html'), 'utf-8');
        const transformedTemplate = await vite.transformIndexHtml(url, template);
        const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
        const appHtml = await render(url);
        const html = transformedTemplate.replace('<!--app-html-->', () => appHtml);
        return reply.type('text/html').send(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        request.log.error(error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return reply.code(500).send(message);
      }
    });
  } else {
    const clientDist = resolve(root, 'dist/client');
    const serverEntry = resolve(root, 'dist/server/entry-server.js');

    await app.register(fastifyStatic, {
      root: join(clientDist, 'assets'),
      prefix: '/assets/'
    });

    await app.register(fastifyStatic, {
      root: join(clientDist, 'projects'),
      prefix: '/projects/',
      decorateReply: false
    });

    await app.register(fastifyStatic, {
      root: join(clientDist, 'roomwalk'),
      prefix: '/roomwalk/',
      decorateReply: false
    });

    app.get('/logo.svg', async (_, reply) => {
      const logoFile = await fs.readFile(join(clientDist, 'logo.svg'));
      return reply.type('image/svg+xml').send(logoFile);
    });

    app.get('/hero-main.jpg', async (_, reply) => {
      const heroFile = await fs.readFile(join(clientDist, 'hero-main.jpg'));
      return reply.type('image/jpeg').send(heroFile);
    });

    app.get('/favicon.ico', async (_, reply) => reply.code(204).send());

    app.get('*', async (request, reply) => {
      try {
        const url = request.raw.url || '/';
        const template = await fs.readFile(join(clientDist, 'index.html'), 'utf-8');
        const { render } = (await import(serverEntry)) as { render: (url?: string) => string | Promise<string> };
        const appHtml = await render(url);
        const html = template.replace('<!--app-html-->', () => appHtml);
        return reply.type('text/html').send(html);
      } catch (error) {
        request.log.error(error);
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
          return reply.code(500).send('Build files not found. Run "npm run build" before "npm run start".');
        }
        return reply.code(500).send('Internal server error');
      }
    });
  }

  return app;
}

const port = Number(process.env.PORT || 3000);
const host = isProd ? '0.0.0.0' : '127.0.0.1';

createServer()
  .then((app) => app.listen({ port, host }))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
