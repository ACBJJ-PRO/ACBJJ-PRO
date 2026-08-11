import type { VercelRequest, VercelResponse } from '@vercel/node';
import { migrateDataToCloudSQL } from './_lib/migration.js';

const PROTECTED_KEYS = new Set([
  'usuarios',
  'alunos',
  'professores',
  'noticias',
  'videos',
  'liveStreams',
  'mensalidades',
  'auditLogs',
  'contratosOficiais',
  'contratoAceites',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // ignore parse error
      }
    }

    const { key, data } = body || {};

    if (!key || data === undefined) {
      return res.status(400).json({ error: 'Key and data are required' });
    }

    // Protection check for protected/sensitive keys
    if (PROTECTED_KEYS.has(String(key))) {
      const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized: Missing or invalid token for protected state key',
          code: 'UNAUTHORIZED',
        });
      }
    }

    const result = await migrateDataToCloudSQL({ [key]: data });
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error || 'Erro ao persistir no Cloud SQL' });
    }
    return res.status(200).json({ success: true, key, cloudSynced: true });
  } catch (e: any) {
    console.error('Error in /api/update-state handler:', e);
    return res.status(503).json({ success: false, error: 'Erro ao persistir no Cloud SQL', details: String(e?.message || e) });
  }
}

