import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import tls from 'tls';
import * as schema from './schema.js';
import { ensureTablesCreated } from './ensure-schema.js';

// Clean up PGHOST if default env contains localhost or 127.0.0.1
if (process.env.PGHOST === '127.0.0.1' || process.env.PGHOST === 'localhost' || process.env.PGHOST === '::1') {
  delete process.env.PGHOST;
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

function checkIsDbConfigured(): boolean {
  if (!connectionString) return false;
  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname;
    if (host === '127.0.0.1' || host === 'localhost' || host === '::1' || !host) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const isDatabaseUrlConfigured = checkIsDbConfigured();

function getCaCertificate(): string | undefined {
  const raw = process.env.DB_CA_CERT 
    || process.env.POSTGRES_CA_CERT 
    || process.env.SSL_CERT 
    || process.env.POSTGRES_CA 
    || process.env.CA_CERT;

  if (!raw) return undefined;

  let cert = raw.trim();
  if (!cert.includes('-----BEGIN CERTIFICATE-----')) {
    try {
      const decoded = Buffer.from(cert, 'base64').toString('utf-8');
      if (decoded.includes('-----BEGIN CERTIFICATE-----')) {
        cert = decoded;
      }
    } catch {}
  }

  if (cert.includes('\\n')) {
    cert = cert.replace(/\\n/g, '\n');
  }
  cert = cert.replace(/\r\n/g, '\n');

  // Ensure clean separation if concatenated without newlines
  cert = cert.replace(/-----END CERTIFICATE-----\s*-----BEGIN CERTIFICATE-----/g, '-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----');

  if (!cert.includes('-----BEGIN CERTIFICATE-----') || !cert.includes('-----END CERTIFICATE-----')) {
    console.warn('[Cloud SQL CA] Provided DB_CA_CERT does not contain valid PEM certificate delimiters.');
    return undefined;
  }

  return cert;
}

function createDummyPool(reason: string) {
  const dummy: any = {
    options: {},
    on: () => dummy,
    removeListener: () => dummy,
    query: () => Promise.reject(new Error(reason)),
    connect: () => Promise.reject(new Error(reason)),
    end: () => Promise.resolve(),
  };
  return dummy;
}

export const createPool = () => {
  try {
    if (connectionString) {
      let cleanConnectionString = connectionString;
      const ca = getCaCertificate();

      let host = '';
      let port = 5432;
      let database = '';
      let user: string | undefined = undefined;
      let password: string | undefined = undefined;

      try {
        const parsed = new URL(connectionString);
        host = parsed.hostname;
        port = parsed.port ? Number(parsed.port) : 5432;
        database = parsed.pathname.replace(/^\//, '') || 'postgres';
        user = parsed.username ? decodeURIComponent(parsed.username) : undefined;
        password = parsed.password ? decodeURIComponent(parsed.password) : undefined;

        const paramsToDelete: string[] = [];
        for (const key of parsed.searchParams.keys()) {
          if (key.toLowerCase().startsWith('ssl')) {
            paramsToDelete.push(key);
          }
        }
        for (const param of paramsToDelete) {
          parsed.searchParams.delete(param);
        }
        cleanConnectionString = parsed.toString();
      } catch {}

      if (host === '127.0.0.1' || host === 'localhost' || host === '::1') {
        console.warn('[Cloud SQL Notice] DATABASE_URL points to localhost/127.0.0.1. Using fallback pool.');
        return createDummyPool('DATABASE_URL points to localhost/127.0.0.1');
      }

      const ssl = process.env.SQL_SSL === 'false'
        ? false
        : ca
        ? {
            rejectUnauthorized: true,
            ca,
            checkServerIdentity: (targetHost: string, cert: tls.PeerCertificate) => {
              const err = tls.checkServerIdentity(targetHost, cert);
              if (!err) return undefined;
              const altnames = cert.subjectaltname || '';
              const cn = cert.subject?.CN || '';
              if (
                altnames.includes('.sql.goog') ||
                cn.includes('.sql.goog') ||
                (host && (altnames.includes(host) || cn.includes(host)))
              ) {
                return undefined;
              }
              return err;
            },
          }
        : { rejectUnauthorized: false };

      console.log(`[Cloud SQL Pool] Initializing via DATABASE_URL target (host=${host}, port=${port}, database=${database}, customCa=${Boolean(ca)})`);

      return new Pool({
        host: host || undefined,
        port: port || 5432,
        database: database || undefined,
        user: user || undefined,
        password: password || undefined,
        connectionString: cleanConnectionString,
        ssl,
        connectionTimeoutMillis: 8000,
        idleTimeoutMillis: 10000,
        max: 5,
        keepAlive: true,
        allowExitOnIdle: true,
      });
    }
  } catch (err: any) {
    console.warn('[Cloud SQL Pool Init Notice]:', err?.message || err);
    return createDummyPool(err?.message || 'Database initialization error');
  }

  console.log('[Cloud SQL Pool] DATABASE_URL is not configured.');
  return createDummyPool('DATABASE_URL is not configured');
};

export const pool = createPool();

try {
  if (pool && typeof pool.on === 'function') {
    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle SQL pool client:', err?.message || String(err));
    });
  }
} catch {}

let schemaPromise: Promise<void> | null = null;
let lastSchemaErrorTime = 0;

export async function ensureSchema(force = false) {
  if (!isDatabaseUrlConfigured) {
    throw new Error('DATABASE_URL is not configured');
  }

  const now = Date.now();
  if (force) {
    schemaPromise = null;
    lastSchemaErrorTime = 0;
  } else if (lastSchemaErrorTime && now - lastSchemaErrorTime < 3000) {
    throw new Error('Cloud SQL connection is currently unreachable.');
  }

  if (!schemaPromise) {
    schemaPromise = ensureTablesCreated(pool)
      .then(() => {
        lastSchemaErrorTime = 0;
      })
      .catch((err) => {
        schemaPromise = null;
        lastSchemaErrorTime = Date.now();
        throw err;
      });
  }
  return schemaPromise;
}

export const db = drizzle(pool, { schema });

