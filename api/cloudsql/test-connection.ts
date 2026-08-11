import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool, isDatabaseUrlConfigured } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isDatabaseUrlConfigured) {
    return res.status(503).json({
      ok: false,
      error: 'DATABASE_URL is not configured',
      code: 'MISSING_DATABASE_URL',
    });
  }

  try {
    const client = await pool.connect();
    try {
      const q1 = await client.query('SELECT 1 as num;');
      const q2 = await client.query('SELECT current_database() as db;');
      const q3 = await client.query('SELECT inet_server_addr()::text as addr;');

      const select1 = q1.rows?.[0]?.num ? Number(q1.rows[0].num) : 1;
      const currentDb = q2.rows?.[0]?.db || 'postgres';
      const serverAddr = q3.rows?.[0]?.addr || 'cloudsql';

      return res.status(200).json({
        ok: true,
        database: currentDb,
        select_1: select1,
        inet_server_addr: serverAddr,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    const safeError = err?.message || String(err);
    return res.status(503).json({
      ok: false,
      error: safeError,
      code: 'CONNECTION_FAILED',
    });
  }
}

