import { fetchStateFromCloudSQL } from './_lib/cloudsql-state.js';
import { migrateDataToCloudSQL } from './_lib/migration.js';

export async function getFirestoreState() {
  try {
    return await fetchStateFromCloudSQL();
  } catch (err) {
    console.error('Error fetching Cloud SQL state via _db helper:', err);
    return null;
  }
}

export function sanitizeForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null || typeof val !== 'object') return val;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch (e) {
    return val;
  }
}

export async function saveFirestoreStateKey(key: string, data: any) {
  if (!key || data === undefined) return false;
  try {
    await migrateDataToCloudSQL({ [key]: data });
    return true;
  } catch (err) {
    console.error('Error saving Cloud SQL key via _db helper:', key, err);
    return false;
  }
}

