/**
 * Utility to save files either using modern File System Access API (showSaveFilePicker)
 * allowing full folder/directory selection dialogs on supported browsers,
 * or falling back to standard browser anchor tag downloads.
 */
export async function downloadImageWithPicker(
  dataUrl: string,
  suggestedFilename: string
): Promise<boolean> {
  const filename =
    suggestedFilename.endsWith('.jpg') || suggestedFilename.endsWith('.png')
      ? suggestedFilename
      : `${suggestedFilename}.jpg`;

  try {
    // Convert Data URL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    // Check if File System Access API (showSaveFilePicker) is supported in current browser
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'JPEG Image',
              accept: {
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (err: any) {
        // User cancelled the file picker dialog
        if (err.name === 'AbortError') {
          return false;
        }
        console.warn('showSaveFilePicker error, falling back to standard download:', err);
      }
    }

    // Fallback: standard browser download via dynamic anchor link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Failed to download image:', e);
    // Ultimate fallback using simple anchor
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}
