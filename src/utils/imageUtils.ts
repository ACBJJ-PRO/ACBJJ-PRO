/**
 * Image processing utilities for logo uploads and image compression
 */

export function processAndResizeUploadedImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    if (!validTypes.includes(file.type) && !isSvg && !file.type.startsWith('image/')) {
      reject(new Error('Formato de imagem inválido. Aceito apenas PNG, SVG, JPG, JPEG e WEBP.'));
      return;
    }

    // SVG: vector format, read directly as Data URL to preserve scalability
    if (isSvg) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Erro ao processar arquivo SVG.'));
        }
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo SVG.'));
      reader.readAsDataURL(file);
      return;
    }

    // Raster images (PNG, JPG, JPEG, WEBP): Read and compress via Canvas
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling if dimensions exceed maxWidth or maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          if (typeof e.target?.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error('Contexto de imagem indisponível.'));
          }
          return;
        }

        // Clear canvas to preserve PNG alpha/transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Determine format: PNG or JPEG
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outputFormat = isPng ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputFormat, isPng ? undefined : 0.92);

        resolve(dataUrl);
      };

      img.onerror = () => {
        if (typeof e.target?.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Falha ao carregar a imagem selecionada.'));
        }
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Falha na leitura do arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
