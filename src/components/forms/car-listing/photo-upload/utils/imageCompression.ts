
/**
 * Utility for compressing images before upload
 * Created: 2025-07-18
 */

/**
 * Compresses an image file to reduce size while maintaining quality
 * @param file The image file to compress
 * @param maxSizeKB The maximum size in KB (default 1024KB/1MB)
 * @returns A promise that resolves to the compressed file
 */
export const compressImage = async (file: File, maxSizeKB = 1024): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If file is already smaller than max size, just return it
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }
    
    // Only process image files
    if (!file.type.startsWith('image/')) {
      reject(new Error('The file must be an image'));
      return;
    }
    
    // Create image and canvas elements for compression
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to create canvas context'));
      return;
    }
    
    // Set up image load handler
    img.onload = () => {
      // Calculate scaled dimensions (maintain aspect ratio)
      let width = img.width;
      let height = img.height;
      
      // Max dimensions for reasonable file size
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1920;
      
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      
      if (height > MAX_HEIGHT) {
        width = Math.round((width * MAX_HEIGHT) / height);
        height = MAX_HEIGHT;
      }
      
      // Set canvas size to scaled dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas with scaling
      ctx.drawImage(img, 0, 0, width, height);
      
      // Start with high quality
      let quality = 0.9;
      let outputBlob: Blob;
      
      // Try to compress to target size
      const compressAndCheck = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Convert data URL to blob
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        outputBlob = new Blob([ab], { type: mimeString });
        
        // If still too big and quality can be reduced, try again
        if (outputBlob.size > maxSizeKB * 1024 && quality > 0.2) {
          quality = Math.max(0.2, quality - 0.1);
          compressAndCheck();
        } else {
          // Convert blob to file
          const newFile = new File([outputBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(newFile);
        }
      };
      
      // Start compression
      compressAndCheck();
    };
    
    // Handle load errors
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    // Load image from file
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Creates a thumbnail from a file
 * @param file The image file to create a thumbnail from
 * @param maxWidth The maximum width of the thumbnail
 * @returns A promise that resolves to the thumbnail as a data URL
 */
export const createThumbnail = async (file: File, maxWidth = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('The file must be an image'));
      return;
    }
    
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to create canvas context'));
      return;
    }
    
    img.onload = () => {
      // Calculate scaled dimensions
      const scale = maxWidth / img.width;
      const width = maxWidth;
      const height = img.height * scale;
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas with scaling
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail creation'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};
