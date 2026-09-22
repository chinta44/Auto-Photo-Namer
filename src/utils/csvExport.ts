// Receipt list -> CSV (opens correctly in Excel / Google Sheets, importable into bookkeeping tools).
import type { SavedPhoto } from '../types';

export const RECEIPT_CSV_HEADER = ['取引日', '店舗名', '金額(円)', '税額(円)', '品目', 'ファイル名', '保存日時', 'タグ', 'メモ'];

/** "1,280円" / "¥1,280" / "税込 １，２８０円" -> 1280. Returns null when there is no number. */
export function parseYen(text?: string | null): number | null {
  if (!text) return null;
  const s = String(text).normalize('NFKC').replace(/[,，、\s]/g, '');
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? Math.round(n) : null;
}

const ERA_BASE: Record<string, number> = { 令和: 2018, R: 2018, 平成: 1988, H: 1988, 昭和: 1925, S: 1925 };

/** Receipt dates come in many shapes ("2026/9/21", "2026年9月21日", "令和8年9月21日", "R8.9.21"). -> "2026-09-21" or null. */
export function normalizeReceiptDate(text?: string | null): string | null {
  if (!text) return null;
  const s = String(text).normalize('NFKC').trim();
  const pad = (n: number) => String(n).padStart(2, '0');
  const valid = (y: number, m: number, d: number) => y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

  let m = s.match(/(\d{4})\s*[年/.\-]\s*(\d{1,2})\s*[月/.\-]\s*(\d{1,2})/);
  if (m && valid(+m[1], +m[2], +m[3])) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;

  m = s.match(/(令和|平成|昭和|[RHS])\s*(\d{1,2}|元)\s*[年.\-/]\s*(\d{1,2})\s*[月.\-/]\s*(\d{1,2})/i);
  if (m) {
    const base = ERA_BASE[m[1].toUpperCase()] ?? ERA_BASE[m[1]];
    const y = base + (m[2] === '元' ? 1 : +m[2]);
    if (base && valid(y, +m[3], +m[4])) return `${y}-${pad(+m[3])}-${pad(+m[4])}`;
  }

  m = s.match(/(?<!\d)(\d{4})(\d{2})(\d{2})(?!\d)/);
  if (m && valid(+m[1], +m[2], +m[3])) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/** One CSV field: quotes when needed and neutralizes spreadsheet formulas (=, +, -, @). */
export function csvText(value: unknown): string {
  let s = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildReceiptCsv(photos: SavedPhoto[]): string {
  const rows = photos
    .filter((p) => p.category === 'receipt')
    .map((p, index) => {
      const d = p.analysis?.details ?? {};
      const date = normalizeReceiptDate(d.receiptDate) ?? '';
      const amount = parseYen(d.receiptAmount);
      const tax = parseYen(d.receiptTax);
      const items = Array.isArray(d.receiptItems) ? d.receiptItems.join(' / ') : '';
      return {
        index,
        date,
        cells: [
          date,
          d.receiptStore || p.analysis?.detectedTitle || '不明',
          amount === null ? '' : String(amount),
          tax === null ? '' : String(tax),
          items,
          p.filename,
          p.timestamp,
          (p.customTags || []).join(' '),
          p.notes || '',
        ],
        numeric: [2, 3],
      };
    });

  // Oldest first (dates that could not be read go last, in gallery order).
  rows.sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : a.index - b.index;
    if (a.date) return -1;
    if (b.date) return 1;
    return a.index - b.index;
  });

  const lines = [RECEIPT_CSV_HEADER.map(csvText).join(',')];
  for (const r of rows) {
    lines.push(r.cells.map((c, i) => (r.numeric.includes(i) ? c : csvText(c))).join(','));
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
