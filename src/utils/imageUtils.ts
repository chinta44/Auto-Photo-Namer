/**
 * 任意のフォーマットの画像データURL(SVG・PNG・WebPなど)を、
 * Gemini Vision APIが確実に受け付けられる JPEG の data URL に変換する。
 *
 * 「ワンクリック体験サンプル写真」はSVGのプレースホルダーで作られているため、
 * そのままGemini APIに送るとデコードエラーになる。撮影・アップロードした
 * 実写真はもともとJPEGだが、念のため常にこの関数を通してから送信する。
 */
export function convertToJpegBase64(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D contextを取得できませんでした。'));
        return;
      }

      // SVGなど透過がある場合に備えて白背景で塗ってからJPEG化する
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました。ファイル形式を確認してください。'));
    };

    img.src = dataUrl;
  });
}
