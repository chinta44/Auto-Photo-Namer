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
