/**
 * Returns current local date (JST) formatted according to user settings.
 * Avoids UTC timezone offsets (new Date().toISOString()) which cause date shift issues.
 */
export function getFormattedToday(format: 'YYYYMMDD' | 'YYYY-MM-DD' | 'None' = 'YYYYMMDD'): string {
  if (format === 'None') return '';

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  return `${year}${month}${day}`;
}

export function getJSTDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
