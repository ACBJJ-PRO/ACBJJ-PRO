import { CarteirinhaConfig, UserCarteirinhaData, User, Student, CarteirinhaCredential, CarteirinhaAuthLog } from '../types';
import { INITIAL_USERS, INITIAL_STUDENTS } from '../data';

export const DEFAULT_CARTEIRINHA_CONFIG: CarteirinhaConfig = {
  corPrincipal: '#0f0f0f',
  corSecundaria: '#1a1a1a',
  usarGradient: true,

  logoPrincipalUrl: '',
  logoUsarBranca: true,
  logoPosicao: 'esquerda',

  textoMarcaDagua: 'ACBJJ',
  opacidadeMarcaDagua: 0.06,
  posicaoMarcaDagua: 'centro',
  fonteMarcaDagua: 'JetBrains Mono',
  tamanhoFonteMarcaDagua: 120,
  offsetXMarcaDagua: 55,
  offsetYMarcaDagua: 30,
  rotacaoMarcaDagua: 0,

  nomeInstituicao: 'ARENA DO COMPETIDOR',
  numeroAcademia: '#9240',
  localizacaoTexto: 'São Luís – Maranhão / Brasil',
  exibirBandeiraBrasil: true,

  exibirFoto: true,
  exibirNome: true,
  exibirRegistro: true,
  exibirProfessor: true,
  exibirTurma: true,
  exibirGraduacao: true,
  exibirValidade: true,
  exibirLocalizacao: true,
  exibirQrCode: true,
  exibirMarcaDagua: true,
  exibirStatus: true,
  exibirNumeroAcademia: true,

  // Verso Config Defaults
  versoCorPrincipal: '#0f0f0f',
  versoCorSecundaria: '#1c1c1c',
  versoUsarGradient: true,

  versoLogoExibir: true,
  versoLogoPosicao: 'centro',
  versoLogoTamanho: 36,

  versoMarcaDaguaExibir: true,
  versoMarcaDaguaPosicao: 'centro',
  versoMarcaDaguaOpacidade: 0.08,
  versoMarcaDaguaTamanho: 100,
  versoMarcaDaguaOffsetX: 0,
  versoMarcaDaguaOffsetY: 0,
  versoMarcaDaguaRotacao: -10,

  versoQrPosicao: 'centro',
  versoQrTamanho: 90,

  versoCodigoPosicao: 'centro',
  versoCodigoFonte: 'JetBrains Mono',
  versoCodigoTamanho: 12,

  versoExibirRegistro: true,
  versoExibirValidade: true,
  versoExibirStatus: true,
  versoExibirMensagem: true,
  versoMensagemSeguranca: 'Carteirinha oficial. Autentique esta identificação através do QR Code ou código de autenticação no sistema Arena do Competidor.',
};

const STORAGE_KEY_CONFIG = 'arena_carteirinha_config';
const STORAGE_KEY_USERS = 'arena_carteirinha_usuarios';
const STORAGE_KEY_CREDENTIALS = 'arena_carteirinha_credentials';
const STORAGE_KEY_AUTH_LOGS = 'arena_carteirinha_auth_logs';

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Global Cloud SQL sync trigger flag
let isCloudSqlSyncInProgress = false;

// Async function to load state from Cloud SQL when localStorage is empty
export async function syncCarteirinhaDataFromCloudSQL(): Promise<void> {
  if (isCloudSqlSyncInProgress) return;
  isCloudSqlSyncInProgress = true;
  try {
    // 1. Fetch config
    const configRes = await fetch('/api/cloudsql/carteirinhas/config').catch(() => null);
    if (configRes && configRes.ok) {
      const configJson = await configRes.json();
      if (configJson.success && configJson.config) {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(configJson.config));
      }
    }

    // 2. Fetch credentials
    const credsRes = await fetch('/api/cloudsql/carteirinhas/credentials').catch(() => null);
    if (credsRes && credsRes.ok) {
      const credsJson = await credsRes.json();
      if (credsJson.success && Array.isArray(credsJson.carteirinhas)) {
        const credMap: Record<string, CarteirinhaCredential> = {};
        for (const item of credsJson.carteirinhas) {
          const raw = item.rawCarteirinha || item;
          const entityType = item.entityType || raw.entityType || (item.id?.startsWith('student-') ? 'student' : 'user');
          const entityId = item.entityId || raw.entityId || item.userId;
          const idKey = item.id || `${entityType}-${entityId}`;
          credMap[idKey] = {
            id: idKey,
            credentialId: item.credentialId || raw.credentialId,
            authCode: item.authCode || raw.authCode,
            entityType,
            entityId,
            userId: idKey,
            userNome: item.userNome || raw.userNome,
            userTipo: item.userTipo || raw.userTipo,
            fotoPerfil: item.fotoPerfil || raw.fotoPerfil,
            status: item.status || raw.status || 'ativo',
            validade: item.validade || raw.validade || 'DEZ/2027',
            registro: item.registro || raw.registro,
            qrToken: item.qrToken || raw.qrToken || getCarteirinhaVerifyUrl(item.credentialId),
            createdAt: item.createdAt || raw.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || raw.updatedAt || new Date().toISOString(),
          };
        }
        if (Object.keys(credMap).length > 0) {
          localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(credMap));
        }
      }
    }

    // 3. Fetch logs
    const logsRes = await fetch('/api/cloudsql/carteirinhas/logs').catch(() => null);
    if (logsRes && logsRes.ok) {
      const logsJson = await logsRes.json();
      if (logsJson.success && Array.isArray(logsJson.logs)) {
        const parsedLogs: CarteirinhaAuthLog[] = logsJson.logs.map((l: any) => l.rawLog || l);
        localStorage.setItem(STORAGE_KEY_AUTH_LOGS, JSON.stringify(parsedLogs));
      }
    }
  } catch (err) {
    console.warn('Carteirinha Cloud SQL Sync Notice:', err);
  } finally {
    isCloudSqlSyncInProgress = false;
  }
}

export function getCarteirinhaVerifyUrl(credentialId: string, customOrigin?: string): string {
  const cleanId = (credentialId || '').trim();
  if (customOrigin) {
    const cleanOrigin = customOrigin.replace(/\/+$/, '');
    return `${cleanOrigin}/verify/card/${cleanId}`;
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/verify/card/${cleanId}`;
  }
  return `/verify/card/${cleanId}`;
}

export function getCarteirinhaConfig(): CarteirinhaConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return { ...DEFAULT_CARTEIRINHA_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Erro ao ler carteirinha_config:', e);
  }
  // Trigger background restoration from Cloud SQL if empty
  syncCarteirinhaDataFromCloudSQL();
  return DEFAULT_CARTEIRINHA_CONFIG;
}

export function saveCarteirinhaConfig(config: CarteirinhaConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arena_carteirinha_config_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // Persist to Cloud SQL atomically
    fetch('/api/cloudsql/carteirinhas/config/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    }).catch((err) => console.warn('Failed to save carteirinha config to Cloud SQL:', err));
  } catch (e) {
    console.error('Erro ao salvar carteirinha_config:', e);
  }
}

export function getUserCarteirinhaDataMap(): Record<string, UserCarteirinhaData> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao ler carteirinha_usuarios:', e);
  }
  return {};
}

export function saveUserCarteirinhaDataMap(map: Record<string, UserCarteirinhaData>): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(map));
  } catch (e) {
    console.error('Erro ao salvar carteirinha_usuarios:', e);
  }
}

// Credentials Map Management
export function getCarteirinhaCredentialsMap(): Record<string, CarteirinhaCredential> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CREDENTIALS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao ler carteirinha_credentials:', e);
  }
  syncCarteirinhaDataFromCloudSQL();
  return {};
}

export function saveCarteirinhaCredentialsMap(map: Record<string, CarteirinhaCredential>, overwrite = false): void {
  try {
    const existingMap = getCarteirinhaCredentialsMap();
    const finalMap = overwrite ? map : { ...existingMap, ...map };
    localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(finalMap));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arena_carteirinha_credentials_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.error('Erro ao salvar carteirinha_credentials:', e);
  }
}

// Atomic Cloud SQL save for a single credential
export function saveSingleCredentialCloudSQL(cred: CarteirinhaCredential): void {
  try {
    fetch('/api/cloudsql/carteirinhas/credentials/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: cred }),
    }).catch((err) => console.warn('Failed to save single credential to Cloud SQL:', err));
  } catch (e) {
    console.error('Erro ao chamar API Cloud SQL de credencial:', e);
  }
}

export function applyAuthCodeMask(rawInput: string): string {
  if (!rawInput) return '';

  const trimmed = rawInput.trim();

  if (
    trimmed.toUpperCase().startsWith('HTTP://') ||
    trimmed.toUpperCase().startsWith('HTTPS://') ||
    trimmed.includes('/') ||
    trimmed.toUpperCase().includes('VERIFY')
  ) {
    return trimmed;
  }

  const uppercase = trimmed.toUpperCase();
  const clean = uppercase.replace(/[^A-Z0-9]/g, '');

  if (clean.startsWith('ACBJJ')) {
    const prefix = 'ACBJJ';
    const rest = clean.slice(5, 13);
    if (rest.length === 0) return prefix;
    if (rest.length <= 4) return `${prefix}-${rest}`;
    return `${prefix}-${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  if (clean.startsWith('CARD')) {
    const prefix = 'CARD';
    const rest = clean.slice(4);
    if (rest.length === 0) return prefix;
    if (rest.length <= 4) return `${prefix}-${rest}`;
    return `${prefix}-${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  if ('ACBJJ'.startsWith(clean) || 'CARD'.startsWith(clean)) {
    return clean;
  }

  if (clean.length > 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
  } else if (clean.length > 4) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }

  return clean;
}

export interface AuditCredentialsResult {
  totalAnalyzed: number;
  authCodeDuplicatesFixed: number;
  credentialIdDuplicatesFixed: number;
  incorrectBindingsFixed: number;
  preservedIntact: number;
}

export function auditAndDeduplicateCredentials(): AuditCredentialsResult {
  const map = getCarteirinhaCredentialsMap();
  const entries = Object.entries(map);
  const totalAnalyzed = entries.length;

  if (totalAnalyzed === 0) {
    return {
      totalAnalyzed: 0,
      authCodeDuplicatesFixed: 0,
      credentialIdDuplicatesFixed: 0,
      incorrectBindingsFixed: 0,
      preservedIntact: 0,
    };
  }

  let authCodeDuplicatesFixed = 0;
  let credentialIdDuplicatesFixed = 0;
  let incorrectBindingsFixed = 0;
  let preservedIntact = 0;

  const usedAuthCodes = new Map<string, string>();
  const usedCredentialIds = new Map<string, string>();

  const cleanedMap: Record<string, CarteirinhaCredential> = {};

  for (const [key, cred] of entries) {
    let needsUpdate = false;
    let currentAuthCode = cred.authCode ? cred.authCode.trim() : '';
    let currentCredentialId = cred.credentialId ? cred.credentialId.trim() : '';

    if (!currentAuthCode || !currentCredentialId) {
      needsUpdate = true;
    }

    if (currentAuthCode) {
      const existingOwner = usedAuthCodes.get(currentAuthCode);
      if (existingOwner && String(existingOwner) !== String(key)) {
        authCodeDuplicatesFixed++;
        needsUpdate = true;
      }
    }

    if (currentCredentialId) {
      const existingOwner = usedCredentialIds.get(currentCredentialId);
      if (existingOwner && String(existingOwner) !== String(key)) {
        credentialIdDuplicatesFixed++;
        needsUpdate = true;
      }
    }

    if (!needsUpdate) {
      usedAuthCodes.set(currentAuthCode, key);
      usedCredentialIds.set(currentCredentialId, key);
      cleanedMap[key] = {
        ...cred,
        id: key,
        qrToken: getCarteirinhaVerifyUrl(currentCredentialId),
      };
      preservedIntact++;
    } else {
      let attempt = 0;
      while (
        !currentAuthCode ||
        !currentCredentialId ||
        (usedAuthCodes.has(currentAuthCode) && String(usedAuthCodes.get(currentAuthCode)) !== String(key)) ||
        (usedCredentialIds.has(currentCredentialId) && String(usedCredentialIds.get(currentCredentialId)) !== String(key))
      ) {
        attempt++;
        const h1 = simpleHash(`audit1-key-${key}-att-${attempt}`).toString(36).toUpperCase().padStart(4, '7');
        const h2 = simpleHash(`audit2-key-${key}-att-${attempt}`).toString(36).toUpperCase().padStart(4, '9');
        const cleanKey = String(key).replace(/\D/g, '') || String(key).replace(/[^a-zA-Z0-9]/g, '');
        const entityDigits = cleanKey.replace(/\D/g, '') || '0';
        currentCredentialId = `CARD-${entityDigits.padStart(4, '0').slice(-4)}-${h1.substring(0, 4)}`;
        currentAuthCode = `ACBJJ-${h1.substring(0, 4)}-${h2.substring(0, 4)}`;
      }

      const fixedCred: CarteirinhaCredential = {
        ...cred,
        id: key,
        credentialId: currentCredentialId,
        authCode: currentAuthCode,
        qrToken: getCarteirinhaVerifyUrl(currentCredentialId),
        updatedAt: new Date().toISOString(),
      };

      usedAuthCodes.set(currentAuthCode, key);
      usedCredentialIds.set(currentCredentialId, key);
      cleanedMap[key] = fixedCred;
    }
  }

  if (authCodeDuplicatesFixed > 0 || credentialIdDuplicatesFixed > 0 || incorrectBindingsFixed > 0) {
    saveCarteirinhaCredentialsMap(cleanedMap, true);
  }

  return {
    totalAnalyzed,
    authCodeDuplicatesFixed,
    credentialIdDuplicatesFixed,
    incorrectBindingsFixed,
    preservedIntact,
  };
}

// Master credential creation / retrieval with STRICT entity separation
export function getOrCreateUserCredential(
  entityTypeOrUserId: 'user' | 'student' | number | string,
  entityIdOrUser?: number | string | User | null,
  userOrStudent?: User | Student | null,
  studentParam?: Student | null
): CarteirinhaCredential {
  let entityType: 'user' | 'student' = 'user';
  let entityId = '';
  let user: User | null = null;
  let student: Student | null = null;

  if (entityTypeOrUserId === 'user' || entityTypeOrUserId === 'student') {
    entityType = entityTypeOrUserId;
    entityId = String(entityIdOrUser || '');
    if (entityType === 'user') {
      user = (userOrStudent as User) || null;
      student = null;
    } else {
      student = (studentParam as Student) || (userOrStudent as Student) || null;
      user = null;
    }
  } else {
    // Legacy fallback call: (userId, user, student)
    const numericOrStringId = String(entityTypeOrUserId);
    user = (entityIdOrUser as User) || null;
    student = (userOrStudent as Student) || null;

    if (student && (!user || user.tipo === 'aluno')) {
      entityType = 'student';
      entityId = String(student.id || numericOrStringId);
    } else if (user) {
      entityType = 'user';
      entityId = String(user.id || numericOrStringId);
    } else {
      entityType = 'user';
      entityId = numericOrStringId;
    }
  }

  const key = `${entityType}-${entityId}`;
  const map = getCarteirinhaCredentialsMap();

  const userNome = entityType === 'student' ? student?.nome : (user?.nome || (user as any)?.name);
  const userTipo = entityType === 'student' ? 'aluno' : (user?.tipo || 'usuario');
  const userFoto = entityType === 'student' ? (student?.fotoPerfil || '') : (user?.fotoPerfil || '');

  if (
    map[key] &&
    map[key].status !== 'revogado' &&
    map[key].authCode &&
    map[key].credentialId
  ) {
    let updated = false;
    const existing = { ...map[key] };
    const latestNome = userNome || existing.userNome;
    const latestTipo = userTipo || existing.userTipo;
    const latestFoto = userFoto || existing.fotoPerfil;
    const expectedQrToken = getCarteirinhaVerifyUrl(existing.credentialId);

    if (latestNome && existing.userNome !== latestNome) {
      existing.userNome = latestNome;
      updated = true;
    }
    if (latestTipo && existing.userTipo !== latestTipo) {
      existing.userTipo = latestTipo;
      updated = true;
    }
    if (latestFoto && existing.fotoPerfil !== latestFoto) {
      existing.fotoPerfil = latestFoto;
      updated = true;
    }
    if (existing.qrToken !== expectedQrToken) {
      existing.qrToken = expectedQrToken;
      updated = true;
    }
    if (existing.entityType !== entityType || existing.entityId !== entityId) {
      existing.entityType = entityType;
      existing.entityId = entityId;
      updated = true;
    }

    if (updated) {
      map[key] = existing;
      saveCarteirinhaCredentialsMap(map);
      saveSingleCredentialCloudSQL(existing);
    }

    return map[key];
  }

  const userCardData = getUserCarteirinhaData(key);
  const finalNome = userNome || (entityType === 'student' ? 'Atleta Arena' : 'Usuário Arena');

  const regNumber = entityType === 'student' && student?.id
    ? `ACBJJ2026${String(student.id).padStart(3, '0')}`
    : `ACBJJ2026${String(entityId).padStart(3, '0')}`;

  let attempt = 0;
  const hashPart1 = simpleHash(`seed1-${key}`).toString(36).toUpperCase().padStart(4, '7');
  const hashPart2 = simpleHash(`seed2-${key}`).toString(36).toUpperCase().padStart(4, '9');

  const cleanEntityId = entityId.replace(/\D/g, '');
  let credentialId = `CARD-${cleanEntityId.padStart(4, '0').slice(-4)}-${hashPart1.substring(0, 4)}`;
  let authCode = `ACBJJ-${hashPart1.substring(0, 4)}-${hashPart2.substring(0, 4)}`;

  while (
    Object.entries(map).some(([k, v]) => k !== key && (v.authCode === authCode || v.credentialId === credentialId))
  ) {
    attempt++;
    const h1 = simpleHash(`seed1-${key}-att-${attempt}`).toString(36).toUpperCase().padStart(4, '7');
    const h2 = simpleHash(`seed2-${key}-att-${attempt}`).toString(36).toUpperCase().padStart(4, '9');
    credentialId = `CARD-${cleanEntityId.padStart(4, '0').slice(-4)}-${h1.substring(0, 4)}`;
    authCode = `ACBJJ-${h1.substring(0, 4)}-${h2.substring(0, 4)}`;
  }

  const qrToken = getCarteirinhaVerifyUrl(credentialId);

  const newCredential: CarteirinhaCredential = {
    id: key,
    credentialId,
    entityType,
    entityId,
    userId: key,
    userNome: finalNome,
    userTipo,
    fotoPerfil: userFoto,
    authCode,
    qrToken,
    registro: regNumber,
    status: userCardData.status === 'cancelado' ? 'cancelado' : 'ativo',
    validade: userCardData.validade || 'DEZ/2027',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viasEmitidas: userCardData.viasEmitidas || 1,
  };

  map[key] = newCredential;
  saveCarteirinhaCredentialsMap(map);
  saveSingleCredentialCloudSQL(newCredential);
  return newCredential;
}

export function revokeUserCredential(holderKey: number | string, motivo?: string): CarteirinhaCredential {
  const map = getCarteirinhaCredentialsMap();
  const key = String(holderKey);

  if (map[key]) {
    map[key] = {
      ...map[key],
      status: 'revogado',
      revokedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCarteirinhaCredentialsMap(map);
    saveSingleCredentialCloudSQL(map[key]);
  }

  updateUserCarteirinhaStatus(holderKey, 'cancelado', motivo || 'Credencial revogada pelo administrador');

  const [eType, eId] = key.startsWith('student-') ? ['student', key.replace('student-', '')] : ['user', key.replace('user-', '')];
  return getOrCreateUserCredential(eType as any, eId);
}

export function getCarteirinhaAuthLogs(): CarteirinhaAuthLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH_LOGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erro ao ler auth_logs:', e);
  }
  return [];
}

export function addCarteirinhaAuthLog(log: Omit<CarteirinhaAuthLog, 'id'>): void {
  try {
    const current = getCarteirinhaAuthLogs();
    const newEntry: CarteirinhaAuthLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    const updated = [newEntry, ...current].slice(0, 100);
    localStorage.setItem(STORAGE_KEY_AUTH_LOGS, JSON.stringify(updated));

    // Save to Cloud SQL
    fetch('/api/cloudsql/carteirinhas/logs/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: newEntry }),
    }).catch((err) => console.warn('Failed to save log to Cloud SQL:', err));
  } catch (e) {
    console.error('Erro ao salvar auth_log:', e);
  }
}

export interface CredentialAuditDiagnostic {
  rawInput: string;
  normalizedQuery: string;
  strippedQuery: string;
  detectedType: string;
  searchedCount: number;
  credentialFound: boolean;
  titularFound: boolean;
  userId?: number | string;
  failedStep?: string;
}

export async function verifyCarteirinhaRemoteCloudSQL(code: string): Promise<any> {
  try {
    const res = await fetch('/api/cloudsql/credentials/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Cloud SQL credential verification notice:', err);
  }
  return null;
}

export function verifyCredentialQuery(
  rawQuery: string,
  method: 'qr_code' | 'codigo_manual' = 'codigo_manual',
  verifiedBy: string = 'Administrador',
  usuarios: User[] = [],
  alunos: Student[] = [],
  currentUser?: User | null
): {
  success: boolean;
  credential?: CarteirinhaCredential;
  userCardData?: UserCarteirinhaData;
  reason?: 'VALID' | 'NOT_FOUND' | 'EXPIRED' | 'CANCELLED' | 'REVOKED';
  message: string;
  scannedPayload?: string;
  diagnostic?: CredentialAuditDiagnostic;
  holderNome?: string;
  holderFoto?: string;
  holderPerfilLabel?: string;
} {
  let targetCode = rawQuery.trim();
  if (targetCode.includes('/verify/card/')) {
    const parts = targetCode.split('/verify/card/');
    targetCode = parts[parts.length - 1].trim();
  } else if (targetCode.includes('/carteirinha/')) {
    const parts = targetCode.split('/carteirinha/');
    targetCode = parts[parts.length - 1].trim();
  } else if (targetCode.includes('verify=')) {
    const parts = targetCode.split('verify=');
    targetCode = parts[1].trim();
  }
  // Strip query strings, hash parameters, and trailing slashes
  targetCode = targetCode.split('?')[0].split('&')[0].split('#')[0].replace(/\/+$/, '').trim();

  const cleanQuery = targetCode.toUpperCase().replace(/\s+/g, '');
  const strippedQuery = cleanQuery.replace(/[^A-Z0-9]/g, '');

  if (!cleanQuery) {
    return {
      success: false,
      reason: 'NOT_FOUND',
      message: '✕ CÓDIGO DE AUTENTICAÇÃO NÃO ENCONTRADO',
      scannedPayload: rawQuery,
      diagnostic: {
        rawInput: rawQuery,
        normalizedQuery: '',
        strippedQuery: '',
        detectedType: 'VAZIO',
        searchedCount: 0,
        credentialFound: false,
        titularFound: false,
        failedStep: 'ENTRADA_VAZIA',
      },
    };
  }

  // Reject incomplete prefix searches
  if (cleanQuery === 'CARD' || cleanQuery === 'ACBJJ' || strippedQuery === 'CARD' || strippedQuery === 'ACBJJ') {
    return {
      success: false,
      reason: 'NOT_FOUND',
      message: '✕ CÓDIGO INCOMPLETO: Digite o código completo da credencial.',
      scannedPayload: rawQuery,
    };
  }

  // Build isolated user & student maps
  const userMap = new Map<string, User>();
  INITIAL_USERS.forEach((u) => { if (u && u.id !== undefined) userMap.set(String(u.id), u); });
  usuarios.forEach((u) => { if (u && u.id !== undefined) userMap.set(String(u.id), u); });
  if (currentUser && currentUser.id !== undefined) userMap.set(String(currentUser.id), currentUser);
  const allUsuarios = Array.from(userMap.values());

  const studentMap = new Map<string, Student>();
  INITIAL_STUDENTS.forEach((a) => { if (a && a.id !== undefined) studentMap.set(String(a.id), a); });
  alunos.forEach((a) => { if (a && a.id !== undefined) studentMap.set(String(a.id), a); });
  const allAlunos = Array.from(studentMap.values());

  // Index user & student credentials separately
  allUsuarios.forEach((u) => {
    getOrCreateUserCredential('user', u.id, u, null);
  });
  allAlunos.forEach((a) => {
    getOrCreateUserCredential('student', a.id, null, a);
  });

  const map = getCarteirinhaCredentialsMap();
  const credentialsList = Object.values(map);

  let matched: CarteirinhaCredential | undefined = undefined;

  // Search Strategy 1: Exact match on credentialId
  matched = credentialsList.find((c) => {
    const cleanId = c.credentialId.toUpperCase();
    const strippedId = cleanId.replace(/[^A-Z0-9]/g, '');
    return cleanId === cleanQuery || strippedId === strippedQuery;
  });

  // Search Strategy 2: Exact match on authCode
  if (!matched) {
    matched = credentialsList.find((c) => {
      const cleanAuth = c.authCode.toUpperCase();
      const strippedAuth = cleanAuth.replace(/[^A-Z0-9]/g, '');
      return cleanAuth === cleanQuery || strippedAuth === strippedQuery;
    });
  }

  // Search Strategy 3: Exact match on QR Token URL or Raw Query
  if (!matched) {
    matched = credentialsList.find((c) => {
      const cleanToken = c.qrToken.toUpperCase();
      return (
        cleanQuery === cleanToken ||
        rawQuery.trim().toUpperCase() === c.qrToken.toUpperCase() ||
        rawQuery.includes(c.credentialId)
      );
    });
  }

  // Search Strategy 4: Exact Match on Registro Number (e.g. ACBJJ2026001)
  if (!matched) {
    matched = credentialsList.find((c) => {
      const cleanReg = c.registro.toUpperCase();
      const strippedReg = cleanReg.replace(/[^A-Z0-9]/g, '');
      return cleanReg === cleanQuery || strippedReg === strippedQuery;
    });
  }

  // Search Strategy 5: Exact Match on CPF or Holder Key
  if (!matched) {
    matched = credentialsList.find((c) => {
      return (
        c.id === cleanQuery ||
        c.id === `user-${strippedQuery}` ||
        c.id === `student-${strippedQuery}`
      );
    });
  }

  // Search Strategy 6: Hash Part Cross-Match (e.g. V0C8 present in both CARD-0004-V0C8 and ACBJJ-V0C8-AAWX)
  if (!matched) {
    const parts = cleanQuery.split(/[-_]/).filter(Boolean);
    let extractedHash = '';
    if (cleanQuery.startsWith('CARD') && parts.length >= 3) {
      extractedHash = parts[parts.length - 1];
    } else if (cleanQuery.startsWith('ACBJJ') && parts.length >= 3) {
      extractedHash = parts[1];
    } else {
      const matchHash = cleanQuery.match(/([A-Z0-9]{4})$/);
      if (matchHash) extractedHash = matchHash[1];
    }

    if (extractedHash && extractedHash.length === 4) {
      matched = credentialsList.find((c) => {
        const cId = (c.credentialId || '').toUpperCase();
        const cAuth = (c.authCode || '').toUpperCase();
        return cId.includes(extractedHash) || cAuth.includes(extractedHash);
      });
    }
  }

  // Search Strategy 7: Entity Numeric ID Resolution Fallback (e.g. CARD-0004-V0C8 -> entityId 4)
  if (!matched) {
    const entityDigits = cleanQuery.replace(/\D/g, '');
    if (entityDigits) {
      const numId = parseInt(entityDigits, 10);
      const foundUser = allUsuarios.find(
        (u) => u.id === numId || String(u.id) === entityDigits || String(u.id) === String(numId)
      );
      if (foundUser) {
        matched = getOrCreateUserCredential('user', foundUser.id, foundUser, null);
      } else {
        const foundStudent = allAlunos.find(
          (a) => a.id === numId || String(a.id) === entityDigits || String(a.id) === String(numId)
        );
        if (foundStudent) {
          matched = getOrCreateUserCredential('student', foundStudent.id, null, foundStudent);
        }
      }
    }
  }

  const detectedType = cleanQuery.startsWith('ACBJJ')
    ? 'ACBJJ_AUTH_CODE'
    : cleanQuery.startsWith('CARD')
    ? 'CARD_CREDENTIAL_ID'
    : cleanQuery.includes('HTTP') || cleanQuery.includes('VERIFY')
    ? 'QR_TOKEN_URL'
    : 'OUTRO';

  const diagnostic: CredentialAuditDiagnostic = {
    rawInput: rawQuery,
    normalizedQuery: cleanQuery,
    strippedQuery: strippedQuery,
    detectedType,
    searchedCount: credentialsList.length,
    credentialFound: !!matched,
    titularFound: !!matched,
    userId: matched?.userId,
    failedStep: !matched ? 'CREDENCIAL_NAO_ENCONTRADA_EM_NENHUMA_ESTRATEGIA' : undefined,
  };

  if (!matched) {
    addCarteirinhaAuthLog({
      credentialId: targetCode || 'UNKNOWN',
      userId: '0',
      userNome: 'Desconhecido',
      dataHora: new Date().toISOString(),
      metodo: method,
      resultado: 'invalido',
      verificadoPor: verifiedBy,
    });
    return {
      success: false,
      reason: 'NOT_FOUND',
      message: '✕ CÓDIGO DE AUTENTICAÇÃO NÃO ENCONTRADO',
      scannedPayload: rawQuery,
      diagnostic,
    };
  }

  // STRICT Holder Resolution by entityType
  const entityType = matched.entityType || (matched.id?.startsWith('student-') ? 'student' : 'user');
  const entityId = matched.entityId || matched.userId;

  let targetUser: User | undefined = undefined;
  let targetStudent: Student | undefined = undefined;

  if (entityType === 'student') {
    targetStudent = allAlunos.find((a) => String(a.id) === String(entityId));
  } else {
    targetUser = allUsuarios.find((u) => String(u.id) === String(entityId));
  }

  const holderFoto = targetStudent?.fotoPerfil || targetUser?.fotoPerfil || matched.fotoPerfil || '';
  const holderNome = targetStudent?.nome || targetUser?.nome || matched.userNome || 'Titular';
  const holderPerfilLabel = entityType === 'student'
    ? 'Atleta / Aluno'
    : getPerfilCarteirinhaLabel(targetUser?.tipo || matched.userTipo, targetUser?.perfilLabel);

  const officialCredential: CarteirinhaCredential = {
    ...matched,
    userNome: holderNome,
    fotoPerfil: holderFoto,
    userTipo: entityType === 'student' ? 'aluno' : (targetUser?.tipo || matched.userTipo || 'usuario'),
  };

  const userCardData = getUserCarteirinhaData(officialCredential.id || officialCredential.userId);

  if (officialCredential.status === 'revogado') {
    addCarteirinhaAuthLog({
      credentialId: officialCredential.credentialId,
      entityType,
      entityId,
      userId: officialCredential.userId,
      userNome: holderNome,
      dataHora: new Date().toISOString(),
      metodo: method,
      resultado: 'revogado',
      verificadoPor: verifiedBy,
    });
    return {
      success: false,
      credential: officialCredential,
      userCardData,
      holderNome,
      holderFoto,
      holderPerfilLabel,
      reason: 'REVOKED',
      message: '✕ CARTEIRINHA NÃO AUTENTICADA: Credencial revogada.',
      scannedPayload: rawQuery,
      diagnostic,
    };
  }

  if (userCardData.status === 'cancelado' || officialCredential.status === 'cancelado') {
    addCarteirinhaAuthLog({
      credentialId: officialCredential.credentialId,
      entityType,
      entityId,
      userId: officialCredential.userId,
      userNome: holderNome,
      dataHora: new Date().toISOString(),
      metodo: method,
      resultado: 'cancelado',
      verificadoPor: verifiedBy,
    });
    return {
      success: false,
      credential: officialCredential,
      userCardData,
      holderNome,
      holderFoto,
      holderPerfilLabel,
      reason: 'CANCELLED',
      message: '✕ CARTEIRINHA NÃO AUTENTICADA: Carteirinha inativa ou cancelada.',
      scannedPayload: rawQuery,
      diagnostic,
    };
  }

  // Check validity date
  const validadeStr = userCardData.validade || officialCredential.validade;
  let isExpired = false;

  if (validadeStr) {
    const matchVal = validadeStr.match(/(\d{2})\/(\d{4})/);
    if (matchVal) {
      const expMonth = parseInt(matchVal[1], 10);
      const expYear = parseInt(matchVal[2], 10);
      const now = new Date();
      const currYear = now.getFullYear();
      const currMonth = now.getMonth() + 1;

      if (currYear > expYear || (currYear === expYear && currMonth > expMonth)) {
        isExpired = true;
      }
    }
  }

  if (isExpired) {
    addCarteirinhaAuthLog({
      credentialId: officialCredential.credentialId,
      entityType,
      entityId,
      userId: officialCredential.userId,
      userNome: holderNome,
      dataHora: new Date().toISOString(),
      metodo: method,
      resultado: 'expirado',
      verificadoPor: verifiedBy,
    });
    return {
      success: false,
      credential: officialCredential,
      userCardData,
      holderNome,
      holderFoto,
      holderPerfilLabel,
      reason: 'EXPIRED',
      message: `✕ CARTEIRINHA NÃO AUTENTICADA: Expirou em ${validadeStr}.`,
      scannedPayload: rawQuery,
      diagnostic,
    };
  }

  addCarteirinhaAuthLog({
    credentialId: officialCredential.credentialId,
    entityType,
    entityId,
    userId: officialCredential.userId,
    userNome: holderNome,
    dataHora: new Date().toISOString(),
    metodo: method,
    resultado: 'valido',
    verificadoPor: verifiedBy,
  });

  return {
    success: true,
    credential: officialCredential,
    userCardData,
    holderNome,
    holderFoto,
    holderPerfilLabel,
    reason: 'VALID',
    message: '✓ CARTEIRINHA AUTENTICADA',
    scannedPayload: rawQuery,
    diagnostic,
  };
}

export function getUserCarteirinhaData(holderKey: number | string): UserCarteirinhaData {
  const map = getUserCarteirinhaDataMap();
  const key = String(holderKey);
  if (map[key]) {
    return map[key];
  }
  const defaultValidade = 'DEZ/' + (new Date().getFullYear() + 1);
  const dataEmissao = new Date().toISOString().split('T')[0];
  const newData: UserCarteirinhaData = {
    userId: key,
    status: 'ativo',
    validade: defaultValidade,
    dataEmissao,
    viasEmitidas: 1,
    historicoEmissoes: [
      {
        id: 'init-' + Date.now(),
        data: dataEmissao,
        acao: 'Emissão Inicial da Carteirinha Virtual',
      },
    ],
  };
  map[key] = newData;
  saveUserCarteirinhaDataMap(map);
  return newData;
}

export function updateUserCarteirinhaStatus(
  holderKey: number | string,
  newStatus: 'ativo' | 'inativo' | 'cancelado',
  motivo?: string
): UserCarteirinhaData {
  const map = getUserCarteirinhaDataMap();
  const key = String(holderKey);
  const current = getUserCarteirinhaData(holderKey);
  const updated: UserCarteirinhaData = {
    ...current,
    status: newStatus,
    historicoEmissoes: [
      {
        id: 'hist-' + Date.now(),
        data: new Date().toISOString().split('T')[0],
        acao: `Status alterado para ${newStatus.toUpperCase()}`,
        motivo,
      },
      ...current.historicoEmissoes,
    ],
  };
  map[key] = updated;
  saveUserCarteirinhaDataMap(map);

  // Sync to Cloud SQL
  const [eType, eId] = key.includes('-') ? key.split('-') : ['user', key];
  fetch('/api/cloudsql/carteirinhas/status/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: key, entityType: eType, entityId: eId, status: newStatus, motivo }),
  }).catch((err) => console.warn('Failed to update status in Cloud SQL:', err));

  return updated;
}

export function renewUserCarteirinhaValidade(
  holderKey: number | string,
  novaValidade: string,
  motivo?: string
): UserCarteirinhaData {
  const map = getUserCarteirinhaDataMap();
  const key = String(holderKey);
  const current = getUserCarteirinhaData(holderKey);
  const updated: UserCarteirinhaData = {
    ...current,
    validade: novaValidade,
    status: 'ativo',
    historicoEmissoes: [
      {
        id: 'hist-' + Date.now(),
        data: new Date().toISOString().split('T')[0],
        acao: `Renovação de Validade para ${novaValidade}`,
        motivo,
      },
      ...current.historicoEmissoes,
    ],
  };
  map[key] = updated;
  saveUserCarteirinhaDataMap(map);

  // Sync to Cloud SQL
  const [eType, eId] = key.includes('-') ? key.split('-') : ['user', key];
  fetch('/api/cloudsql/carteirinhas/status/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: key, entityType: eType, entityId: eId, validade: novaValidade, status: 'ativo', motivo }),
  }).catch((err) => console.warn('Failed to renew validade in Cloud SQL:', err));

  return updated;
}

export function issueNewViaUserCarteirinha(
  holderKey: number | string,
  motivo?: string
): UserCarteirinhaData {
  const map = getUserCarteirinhaDataMap();
  const key = String(holderKey);
  const current = getUserCarteirinhaData(holderKey);
  const newVias = (current.viasEmitidas || 1) + 1;
  const updated: UserCarteirinhaData = {
    ...current,
    viasEmitidas: newVias,
    status: 'ativo',
    historicoEmissoes: [
      {
        id: 'hist-' + Date.now(),
        data: new Date().toISOString().split('T')[0],
        acao: `Emissão de Nova Via (${newVias}ª Via)`,
        motivo: motivo || 'Solicitação de 2ª via / Reemissão',
      },
      ...current.historicoEmissoes,
    ],
  };
  map[key] = updated;
  saveUserCarteirinhaDataMap(map);

  // Sync to Cloud SQL
  const [eType, eId] = key.includes('-') ? key.split('-') : ['user', key];
  fetch('/api/cloudsql/carteirinhas/status/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: key, entityType: eType, entityId: eId, status: 'ativo', motivo: `Emissão de ${newVias}ª via` }),
  }).catch((err) => console.warn('Failed to save 2nd via to Cloud SQL:', err));

  return updated;
}

export function getPerfilCarteirinhaLabel(tipo?: string, userPerfilLabel?: string): string {
  if (userPerfilLabel && userPerfilLabel.trim()) return userPerfilLabel;
  switch (tipo?.toLowerCase()) {
    case 'professor':
      return 'Professor';
    case 'instrutor':
      return 'Instrutor';
    case 'arbitro':
    case 'árbitro':
      return 'Árbitro';
    case 'admin':
    case 'administrador':
      return 'Administrador';
    case 'aluno':
    default:
      return 'Atleta';
  }
}
