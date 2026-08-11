import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchStateFromCloudSQL, defaultState } from './_lib/cloudsql-state.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const state = await fetchStateFromCloudSQL();
    if (state && Array.isArray(state.usuarios)) {
      state.usuarios = state.usuarios.map((u: any) => {
        if (!u || typeof u !== 'object') return u;
        const { password, senha, secret, token, ...safeUser } = u;
        return safeUser;
      });
    }
    return res.status(200).json(state);
  } catch (err: any) {
    console.error('Unhandled error in /api/data handler:', err?.message || err);
    return res.status(503).json({
      error: 'Cloud SQL database connection failed or is unreachable',
      details: String(err?.message || err),
    });
  }
}
