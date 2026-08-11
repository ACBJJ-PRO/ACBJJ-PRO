export function maskPhone(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length === 0) return '';
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

export function formatUppercase(value: string): string {
  return (value || '').toUpperCase();
}

export function maskCPF(value: string): string {
  const clean = (value || '').replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

export function formatDateBR(dateInput?: string | Date | null, fallback: string = ''): string {
  if (!dateInput) return fallback;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return fallback;
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(dateInput).trim();
  if (!str) return fallback;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str) || /^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    return str;
  }

  const datePart = str.split('T')[0].split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-');
    const rest = str.includes(' ') ? str.substring(datePart.length) : (str.includes('T') ? ' ' + str.split('T')[1].slice(0, 5) : '');
    return `${day}/${month}/${year}${rest}`;
  }

  return str;
}
