
/**
 * Utility functions for compressing images
 * Created: 2025-07-19
 */

/**
 * Compresses an image file to reduce size while maintaining reasonable quality
 * @param file The image file to compress
 * @param quality The quality level (0.1 to 1.0)
 * @returns A promise that resolves to a compressed File object
 */
export const compressImage = async (file: File, quality: number = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a FileReader to read the image
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // Create an Image object to draw on canvas
        const img = new Image();
        
        img.onload = () => {
          try {
            // Create a canvas element to compress the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Calculate dimensions (max 1920px on longest side)
            let width = img.width;
            let height = img.height;
            
            if (width > height && width > 1920) {
              height = Math.round((height * 1920) / width);
              width = 1920;
            } else if (height > 1920) {
              width = Math.round((width * 1920) / height);
              height = 1920;
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get compressed data URL
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Convert data URL to Blob
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            
            // Create File from Blob
            const blob = new Blob([ab], { type: mimeType });
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: file.lastModified,
            });
            
            resolve(compressedFile);
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        // Set image source
        img.src = event.target.result as string;
      };
      
      reader.onerror = (err) => {
        reject(err);
      };
      
      // Read the file
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
};
