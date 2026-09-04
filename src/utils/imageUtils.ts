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
  maxDimension: number = 1600
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
