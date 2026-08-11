import type { VercelRequest, VercelResponse } from '@vercel/node';
import { migrateDataToCloudSQL } from './_lib/migration.js';
import { defaultState } from './_lib/cloudsql-state.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const result = await migrateDataToCloudSQL(defaultState);
    if (!result.success) {
      return res.status(503).json({ success: false, error: result.error || 'Erro ao redefinir estado no Cloud SQL' });
    }
    return res.status(200).json({ success: true, dbState: defaultState });
  } catch (e: any) {
    return res.status(503).json({ success: false, error: e?.message || String(e) });
  }
}
