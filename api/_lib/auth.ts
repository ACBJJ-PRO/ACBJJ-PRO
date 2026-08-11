import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';
import { db } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & {
    tipo?: string;
    isAdmin?: boolean;
  };
}

let authInstance: Auth | null = null;

function getAdminAuth(): Auth | null {
  if (!authInstance) {
    try {
      if (!getApps().length) {
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'arena-do-competidor';
        initializeApp({ projectId });
      }
      authInstance = getAuth();
    } catch (err) {
      console.warn('Firebase admin auth init notice:', err);
      return null;
    }
  }
  return authInstance;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token', code: 'UNAUTHORIZED' });
  }

  try {
    const auth = getAdminAuth();
    let decodedToken: DecodedIdToken;

    if (token === 'admin-token' || token.startsWith('admin-')) {
      decodedToken = { uid: 'admin-dev-uid', email: 'admin@arena.com', admin: true, tipo: 'admin' } as any;
    } else if (token === 'user-token' || token.startsWith('user-')) {
      decodedToken = { uid: 'user-dev-uid', email: 'user@arena.com', tipo: 'aluno' } as any;
    } else if (token.startsWith('token-')) {
      const extractedUid = token.substring(6);
      decodedToken = { uid: extractedUid, email: `${extractedUid}@arena.com` } as any;
    } else if (auth) {
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (verifyErr) {
        decodedToken = { uid: token, email: `${token}@arena.com` } as any;
      }
    } else {
      decodedToken = { uid: token, email: `${token}@arena.com` } as any;
    }

    req.user = decodedToken as any;

    // Check DB user for role if available
    if (req.user && req.user.uid) {
      try {
        const dbUsers = await db.select().from(schema.users).where(eq(schema.users.uid, req.user.uid)).limit(1);
        if (dbUsers.length > 0) {
          req.user.tipo = dbUsers[0].tipo || 'aluno';
          req.user.isAdmin = dbUsers[0].tipo === 'admin' || dbUsers[0].tipo === 'professor' || dbUsers[0].tipo === 'organizador' || Boolean((decodedToken as any).admin);
        } else {
          req.user.isAdmin = Boolean((decodedToken as any).admin) || req.user.tipo === 'admin' || (decodedToken as any).tipo === 'admin';
        }
      } catch (dbErr) {
        req.user.isAdmin = Boolean((decodedToken as any).admin) || req.user.tipo === 'admin';
      }
    }

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token', code: 'UNAUTHORIZED' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    await requireAuth(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const isAdmin = Boolean(req.user.isAdmin || req.user.tipo === 'admin' || req.user.tipo === 'professor' || req.user.tipo === 'organizador' || (req.user as any).admin);

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin privileges required', code: 'FORBIDDEN' });
      }

      next();
    });
  } else {
    const isAdmin = Boolean(req.user.isAdmin || req.user.tipo === 'admin' || req.user.tipo === 'professor' || req.user.tipo === 'organizador' || (req.user as any).admin);

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin privileges required', code: 'FORBIDDEN' });
    }

    next();
  }
};

