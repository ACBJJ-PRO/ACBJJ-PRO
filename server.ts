import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dbRouter from './src/server/db-routes';
import { migrateDataToCloudSQL } from './src/server/migration';
import { db, ensureSchema } from './src/db/index';
import * as schema from './src/db/schema';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Serve PWA assets with correct headers
app.get('/sw.js', (req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  next();
});

app.get(['/manifest.json', '/site.webmanifest'], (req, res, next) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
});

// Serve APK download directly from 'ACBJJ.apk'
app.get(['/ACBJJ.apk', '/Arena%20ACBJJ.apk', '/Arena ACBJJ.apk', '/download/apk'], (req, res) => {
  let apkPath = path.join(process.cwd(), 'ACBJJ.apk');
  if (!fs.existsSync(apkPath)) {
    apkPath = path.join(process.cwd(), 'public', 'ACBJJ.apk');
  }
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="ACBJJ.apk"');
    return res.sendFile(apkPath);
  }
  res.status(404).send('Arquivo APK não encontrado na raiz do projeto.');
});

app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/api/cloudsql', dbRouter);

import aiChatHandler from './api/ai-chat.js';
import { fetchStateFromCloudSQL, defaultState } from './src/server/cloudsql-state';

// Trigger initial Cloud SQL data check/seeding ONLY if database is completely empty
(async () => {
  try {
    await ensureSchema();
    const existingUsers = await db.select().from(schema.users);
    const existingConfigs = await db.select().from(schema.systemConfigs);
    if (existingUsers.length === 0 && existingConfigs.length === 0) {
      console.log('Cloud SQL is empty. Seeding initial data...');
      await migrateDataToCloudSQL(defaultState);
      console.log('Cloud SQL initial seeding complete!');
    } else {
      console.log(`Cloud SQL contains existing records (${existingUsers.length} users, ${existingConfigs.length} configs). Preserving database!`);
    }
  } catch (err: any) {
    console.warn('Initial Cloud SQL check notice:', err?.message || String(err));
  }
})();

app.get('/api/data', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const state = await fetchStateFromCloudSQL();
    res.json(state);
  } catch (err: any) {
    console.error('Error fetching Cloud SQL state in server.ts:', err?.message || String(err));
    res.status(503).json({ error: 'Cloud SQL database connection failed or is unreachable', details: String(err?.message || err) });
  }
});

app.post('/api/update-state', async (req, res) => {
  const { key, data } = req.body || {};
  if (!key || data === undefined) {
    return res.status(400).json({ error: 'Key and data are required' });
  }

  try {
    const result = await migrateDataToCloudSQL({ [key]: data });
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error || 'Erro ao persistir no Cloud SQL' });
    }
    return res.json({ success: true, key, cloudSynced: true });
  } catch (err) {
    console.error('Failed to update Cloud SQL for key', key, err);
    return res.status(503).json({ success: false, error: String(err) });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    const result = await migrateDataToCloudSQL(defaultState);
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error || 'Erro ao redefinir estado no Cloud SQL' });
    }
    res.json({ success: true, dbState: defaultState });
  } catch (err) {
    res.status(503).json({ success: false, error: String(err) });
  }
});

app.post('/api/ai-chat', async (req, res) => {
  try {
    await aiChatHandler(req as any, res as any);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Catch-all 404 for unhandled /api routes to prevent falling through to Vite SPA index.html
app.use('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

// Ensure all API errors return JSON rather than Express default HTML error page
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Global Error]:', err?.message || String(err));
  if (!res.headersSent) {
    res.status(503).json({
      success: false,
      error: err?.message || 'Internal API Error',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
