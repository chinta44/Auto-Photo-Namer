import { sanitizeFilename } from '../shared/analysisShared';

export { sanitizeFilename };

/** Splits "abc.jpg" into { base: "abc", ext: ".jpg" } (ext is "" when there is none). */
export function splitExt(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

/**
 * Returns a name that is not in `used` (compared case-insensitively) by adding _2, _3, ...
 * before the extension, and records the chosen name in `used`.
 */
export function makeUniqueName(name: string, used: Set<string>): string {
  const { base, ext } = splitExt(name);
  let candidate = name;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}_${n}${ext}`;
    n++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Like makeUniqueName but only looks at `used` (does not record the result). */
export function peekUniqueName(name: string, used: Set<string>): string {
  const { base, ext } = splitExt(name);
  let candidate = name;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}_${n}${ext}`;
    n++;
  }
  return candidate;
}

/** Makes a name from the UI safe to write (allowed characters, .jpg/.jpeg/.png extension). */
export function toSafeImageFilename(name: string): string {
  return sanitizeFilename(name, 'photo.jpg');
}

/**
 * Makes names unique within one batch: returns the names to use, in the same order.
 * `alreadyUsed` lets the caller reserve names taken earlier in the same session.
 */
export function dedupeNames(names: string[], alreadyUsed: Iterable<string> = []): string[] {
  const used = new Set<string>();
  for (const n of alreadyUsed) used.add(n.toLowerCase());
  return names.map((n) => makeUniqueName(n, used));
}
