/**
 * Deterministic JSON stringifier that sorts object keys alphabetically.
 * Guarantees identical JSON string representations regardless of property insertion order,
 * eliminating false-positive change detections in state sync comparisons.
 */
export function stableStringify(val: any): string {
  if (val === undefined) return 'undefined';
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(val[k])).join(',') + '}';
}

/**
 * Deterministic numeric ID generator for items missing a valid numeric ID.
 * Produces the exact same integer hash for identical inputs instead of calling Date.now().
 */
export function getStableNumericId(obj: any, fallbackOffset: number = 1000): number {
  if (obj && obj.id !== undefined && obj.id !== null && !isNaN(Number(obj.id)) && Number(obj.id) !== 0) {
    return Number(obj.id);
  }
  const key = String(obj?.email || obj?.cpf || obj?.nome || obj?.usuarioId || fallbackOffset);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + fallbackOffset;
}
