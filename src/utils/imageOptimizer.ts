/**
 * Utility for resizing and compressing images in the browser
 * Prevents localStorage QuotaExceededError when uploading phone camera photos
 */

export const compressImageFile = (
  file: File,
  maxWidth: number = 500,
  maxHeight: number = 500,
  quality: number = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== 'string') {
        reject(new Error('Format file tidak valid'));
        return;
      }

      // If it's already an SVG or tiny image, return directly
      if (file.type === 'image/svg+xml' || file.size < 40 * 1024) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(src); // fallback to original on error
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }

          // Image smoothing for high quality downscaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Verify size reduction
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas compression error, using raw image', err);
          resolve(src);
        }
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Optimizes an existing base64 data URL string if it's too large (>100KB)
 */
export const compressDataUrl = (
  dataUrl: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.82
): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith('data:image/') || dataUrl.length < 100 * 1024) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
};
