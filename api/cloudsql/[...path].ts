import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { dbRoutesRouter } from '../_lib/db-routes.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

app.use('/api/cloudsql', dbRoutesRouter);

// Global Error Middleware to prevent default HTML 500 pages on serverless functions
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Serverless API Global Error]:', err?.stack || err?.message || String(err));
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(500).json({
      ok: false,
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno de autenticação. Tente novamente.',
    });
  }
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return app(req as any, res as any);
}
