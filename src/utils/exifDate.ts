// Reads the date a photo was taken, so imported photos are named with their own date
// instead of "today". No dependencies: a small EXIF (JPEG APP1) reader.

const TAG_EXIF_IFD_POINTER = 0x8769;
const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TAG_DATE_TIME_DIGITIZED = 0x9004;
const TAG_DATE_TIME = 0x0132;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats a timestamp as a local "YYYY-MM-DD". */
export function formatLocalDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length && offset + i < view.byteLength; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

function toDateString(exif: string): string | null {
  const m = exif.match(/^(\d{4}):(\d{2}):(\d{2})[ T]/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1990 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const nextYear = new Date().getFullYear() + 1;
  if (y > nextYear) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Extracts "YYYY-MM-DD" from the EXIF block of a JPEG (first bytes of the file are enough). */
export function parseExifDate(buffer: ArrayBuffer): string | null {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;

    let pos = 2;
    while (pos + 4 < view.byteLength) {
      if (view.getUint8(pos) !== 0xff) return null;
      const marker = view.getUint8(pos + 1);
      if (marker === 0xda || marker === 0xd9) return null; // start of scan / end of image: no EXIF found
      const size = view.getUint16(pos + 2);
      if (marker === 0xe1 && readAscii(view, pos + 4, 4) === 'Exif') {
        return parseTiff(view, pos + 10);
      }
      pos += 2 + size;
    }
  } catch {
    // truncated / malformed - treat as "no date"
  }
  return null;
}

function parseTiff(view: DataView, tiffStart: number): string | null {
  const byteOrder = view.getUint16(tiffStart);
  const little = byteOrder === 0x4949;
  if (!little && byteOrder !== 0x4d4d) return null;
  const u16 = (o: number) => view.getUint16(tiffStart + o, little);
  const u32 = (o: number) => view.getUint32(tiffStart + o, little);
  if (u16(2) !== 0x002a) return null;

  const readIfd = (ifdOffset: number): Map<number, { type: number; count: number; valueOffset: number }> => {
    const map = new Map<number, { type: number; count: number; valueOffset: number }>();
    const count = u16(ifdOffset);
    for (let i = 0; i < count; i++) {
      const entry = ifdOffset + 2 + i * 12;
      map.set(u16(entry), { type: u16(entry + 2), count: u32(entry + 4), valueOffset: entry + 8 });
    }
    return map;
  };
  const readString = (e: { type: number; count: number; valueOffset: number }): string | null => {
    if (e.type !== 2 || e.count < 10) return null;
    const dataOffset = e.count <= 4 ? e.valueOffset : u32(e.valueOffset);
    return readAscii(view, tiffStart + dataOffset, e.count);
  };

  const ifd0 = readIfd(u32(4));
  const exifPtr = ifd0.get(TAG_EXIF_IFD_POINTER);
  if (exifPtr) {
    const exifIfd = readIfd(u32(exifPtr.valueOffset));
    for (const tag of [TAG_DATE_TIME_ORIGINAL, TAG_DATE_TIME_DIGITIZED]) {
      const e = exifIfd.get(tag);
      const s = e ? readString(e) : null;
      const date = s ? toDateString(s) : null;
      if (date) return date;
    }
  }
  const dt = ifd0.get(TAG_DATE_TIME);
  const s = dt ? readString(dt) : null;
  return s ? toDateString(s) : null;
}

/**
 * The date a picked file was taken ("YYYY-MM-DD"): EXIF DateTimeOriginal when the file has it,
 * otherwise the file's last-modified date. Returns null if neither is usable.
 */
export async function readCapturedDate(file: File): Promise<string | null> {
  try {
    if (/jpe?g/i.test(file.type) || /\.jpe?g$/i.test(file.name)) {
      const head = await file.slice(0, 262144).arrayBuffer();
      const exif = parseExifDate(head);
      if (exif) return exif;
    }
  } catch {
    // fall through to lastModified
  }
  if (file.lastModified && file.lastModified > 0) {
    const d = formatLocalDate(file.lastModified);
    const year = Number(d.slice(0, 4));
    if (year >= 1990) return d;
  }
  return null;
}
