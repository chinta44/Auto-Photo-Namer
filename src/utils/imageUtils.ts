/**
 * Creates a downscaled JPEG copy of an image, capped to maxDimension on its
 * longest side, for sending to the Gemini API. The AI doesn't need full
 * camera-sensor resolution to classify/read a photo, and sending a smaller
 * image significantly cuts upload time and Gemini processing time. This is
 * used ONLY for the analysis request — the original full-resolution photo
 * is still what gets saved/downloaded.
 */
export async function createAnalysisResizedCopy(
  fullDataUrl: string,
  maxDimension: number = 1024
): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        // Already small enough — no need to resize, just strip the prefix.
        if (width <= maxDimension && height <= maxDimension) {
          const match = fullDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (match) {
            resolve({ mimeType: match[1], base64Data: match[2] });
            return;
          }
        }

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');
        ctx.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const match = resizedDataUrl.match(/^data:(image\/jpeg);base64,(.+)$/);
        if (!match) throw new Error('Failed to create resized JPEG');
        resolve({ mimeType: 'image/jpeg', base64Data: match[2] });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = fullDataUrl;
  });
}

/**
 * Ensure any image DataURL (including SVG DataURLs) is converted to a clean JPEG base64 DataURL
 */
export async function convertToJpegBase64(dataUrl: string): Promise<{ base64Data: string; mimeType: string; fullDataUrl: string }> {
  // If it's already a standard jpeg/png/webp base64 data url, parse mimeType and raw base64 directly
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
  if (match) {
    return {
      mimeType: match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase(),
      base64Data: match[2],
      fullDataUrl: dataUrl,
    };
  }

  // If it's SVG or non-base64 DataURL, render to Canvas and export as JPEG
  return new Promise((resolve, reject) => {
    const img = new Image();
    let blobUrl: string | null = null;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 500;
        canvas.height = img.height || 500;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context unavailable');
        }

        // Fill white background for SVG transparency
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }

        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const jpegMatch = jpegDataUrl.match(/^data:(image\/jpeg);base64,(.+)$/);

        if (jpegMatch) {
          resolve({
            mimeType: 'image/jpeg',
            base64Data: jpegMatch[2],
            fullDataUrl: jpegDataUrl,
          });
        } else {
          throw new Error('Failed to convert canvas to JPEG');
        }
      } catch (err) {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to load image for canvas conversion'));
    };

    if (dataUrl.startsWith('data:image/svg+xml')) {
      try {
        let svgString = '';
        if (dataUrl.includes(';base64,')) {
          svgString = atob(dataUrl.split(';base64,')[1]);
        } else if (dataUrl.includes(',')) {
          svgString = decodeURIComponent(dataUrl.split(',')[1]);
        }

        if (svgString) {
          const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          blobUrl = URL.createObjectURL(blob);
          img.src = blobUrl;
          return;
        }
      } catch (e) {
        console.warn('SVG parsing fallback to direct src', e);
      }
    }

    img.src = dataUrl;
  });
}

/**
 * Creates a smaller JPEG copy of a photo for the in-app gallery.
 *
 * The gallery is persisted in localStorage (roughly 5MB per origin), so keeping
 * full camera-resolution photos there fills the quota after only a few photos.
 * The full-resolution photo is still what the "download" button on the analysis
 * screen saves; this copy is only what the gallery keeps.
 *
 * Never rejects: on any problem (decode error, timeout, canvas failure) or if the
 * result would not be smaller, the original data URL is returned unchanged.
 */
export function createGalleryCopy(
  dataUrl: string,
  maxDimension: number = 1280,
  quality: number = 0.72,
  skipBelowChars: number = 200000
): Promise<string> {
  // Already small (this also covers the built-in SVG sample photos) - keep as is.
  if (dataUrl.length <= skipBelowChars) return Promise.resolve(dataUrl);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(dataUrl), 10000);

    const img = new Image();
    img.onload = () => {
      try {
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        if (!srcW || !srcH) {
          finish(dataUrl);
          return;
        }
        const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
        const width = Math.max(1, Math.round(srcW * scale));
        const height = Math.max(1, Math.round(srcH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(dataUrl);
          return;
        }
        // White background so transparent PNGs don't turn black as JPEG.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const out = canvas.toDataURL('image/jpeg', quality);
        finish(out.startsWith('data:image/jpeg') && out.length < dataUrl.length ? out : dataUrl);
      } catch {
        finish(dataUrl);
      }
    };
    img.onerror = () => finish(dataUrl);
    img.src = dataUrl;
  });
}
