import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import defaultConfig from '../../firebase-applet-config.json' with { type: 'json' };
import { stableStringify } from '../utils/stableStringify';

// --- SAFE ENV RESOLUTION (COMPATIBLE WITH VITE, NODE, VERCEL, AND BROWSER) ---
const getEnvVar = (viteKey: string, envKey: string, fallback: string = ''): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env && import.meta.env[viteKey]) {
      return import.meta.env[viteKey];
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process?.env && process.env[envKey]) {
      return process.env[envKey];
    }
  } catch (e) {}
  return fallback;
};

const firebaseConfig = {
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID', defaultConfig.projectId),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', 'FIREBASE_APP_ID', defaultConfig.appId),
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY', defaultConfig.apiKey),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN', defaultConfig.authDomain),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET', defaultConfig.storageBucket),
  messagingSenderId: defaultConfig.messagingSenderId || "1006707377932",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db: any = null; // Deprecated dummy reference for backward compatibility

// --- HELPER TO DETECT QUOTA EXHAUSTED ERRORS ---
export const isQuotaError = (error: any): boolean => {
  if (!error) return false;
  const str = String(error?.message || error?.code || error).toLowerCase();
  return (
    str.includes('resource-exhausted') ||
    str.includes('resource_exhausted') ||
    str.includes('quota limit exceeded') ||
    str.includes('quota exceeded') ||
    error?.code === 'resource-exhausted' ||
    error?.code === 8
  );
};

export const provider = new GoogleAuthProvider();

// Add critical scopes from firebase config/user choice
provider.addScope('https://www.googleapis.com/auth/contacts');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
provider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');
provider.addScope('https://www.googleapis.com/auth/meetings.space.settings');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// --- ERROR HANDLING STRUCTURED LOGGING ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Cloud SQL Detailed Error Log]:', JSON.stringify(errInfo, null, 2));
  return errInfo;
}

// --- CLOUD SQL STATE HELPERS & REACTIVE EVENT SYNC ---
const firestoreStateCache: Record<string, string> = {};
let globalCallbacks: Set<(data: Record<string, any>) => void> = new Set();
let activeSnapshotData: Record<string, any> = {};

export const subscribeToFirestoreState = (
  onUpdate: (data: Record<string, any>) => void,
  targetKeys?: string[]
) => {
  globalCallbacks.add(onUpdate);

  // Emit cached state if present
  if (Object.keys(activeSnapshotData).length > 0) {
    if (targetKeys && targetKeys.length > 0) {
      const filtered: Record<string, any> = {};
      targetKeys.forEach(k => {
        if (activeSnapshotData[k] !== undefined) filtered[k] = activeSnapshotData[k];
      });
      if (Object.keys(filtered).length > 0) onUpdate(filtered);
    } else {
      onUpdate(activeSnapshotData);
    }
  }

  // Fetch initial state directly from Cloud SQL via /api/data
  fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      if (data && Object.keys(data).length > 0) {
        activeSnapshotData = { ...activeSnapshotData, ...data };
        if (targetKeys && targetKeys.length > 0) {
          const filtered: Record<string, any> = {};
          targetKeys.forEach(k => {
            if (data[k] !== undefined) filtered[k] = data[k];
          });
          if (Object.keys(filtered).length > 0) onUpdate(filtered);
        } else {
          onUpdate(data);
        }
      }
    })
    .catch(() => {});

  return () => {
    globalCallbacks.delete(onUpdate);
  };
};

export const subscribeToFirestoreKey = (key: string, onUpdate: (val: any) => void) => {
  if (!key) return () => {};

  const handler = (e: any) => {
    if (e.detail?.key === key) {
      onUpdate(e.detail.value);
    }
  };
  window.addEventListener('arena_firestore_sync', handler);

  if (firestoreStateCache[key]) {
    try {
      onUpdate(JSON.parse(firestoreStateCache[key]));
    } catch {
      onUpdate(firestoreStateCache[key]);
    }
  }

  return () => {
    window.removeEventListener('arena_firestore_sync', handler);
  };
};

export const sanitizeForFirestore = (val: any): any => {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch (e) {
    return val;
  }
};

const writeDebounceTimers: Record<string, any> = {};
const writeDebounceData: Record<string, any> = {};

export const updateFirestoreStateKey = async (key: string, data: any, forceImmediate = false) => {
  if (!key || data === undefined) return;

  const cleanData = sanitizeForFirestore(data);
  const dataStr = stableStringify(cleanData);

  // Skip writing if the value has not changed
  if (firestoreStateCache[key] === dataStr) {
    return;
  }

  firestoreStateCache[key] = dataStr;
  writeDebounceData[key] = cleanData;

  if (writeDebounceTimers[key]) {
    clearTimeout(writeDebounceTimers[key]);
    writeDebounceTimers[key] = null;
  }

  const flushWrite = async () => {
    const payloadToSave = writeDebounceData[key];
    if (payloadToSave === undefined) return;
    delete writeDebounceData[key];

    // Persist exclusively to Google Cloud SQL PostgreSQL via /api/update-state
    try {
      const res = await fetch('/api/update-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: payloadToSave }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `HTTP ${res.status}`);
      }
      window.dispatchEvent(new CustomEvent('arena_firestore_sync', { detail: { key, value: payloadToSave } }));
    } catch (err: any) {
      console.error('Error persisting key to Cloud SQL:', key, err?.message || err);
      window.dispatchEvent(new CustomEvent('arena_firestore_sync_error', { detail: { key, error: err?.message || String(err) } }));
    }
  };

  if (forceImmediate) {
    await flushWrite();
  } else {
    // Debounce writes by 1000ms per key
    writeDebounceTimers[key] = setTimeout(flushWrite, 1000);
  }
};

export const fetchFirestoreState = async () => {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && Object.keys(serverData).length > 0) {
        return serverData;
      }
    }
  } catch (e) {
    console.warn('[Cloud SQL]: Error fetching state from /api/data:', e);
  }
  return null;
};
