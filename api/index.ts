import type { IncomingMessage, ServerResponse } from 'node:http';

let cachedApp: any = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!cachedApp) {
      const mod = await import('../server.js');
      cachedApp = mod.default;
    }
    return cachedApp(req, res);
  } catch (err: any) {
    console.error('[VERCEL_API_ERROR]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Vercel API initialization failed',
        message: err?.message || String(err),
        code: err?.code || null,
      })
    );
  }
}
