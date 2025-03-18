
/**
 * Changes made:
 * - 2024-08-17: Extracted image compression logic into a separate utility
 * - 2024-08-20: Added better error handling and performance improvements
 */

/**
 * Compresses an image to reduce file size
 * @param file The file to compress
 * @returns A promise that resolves to the compressed file
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context for image compression'));
          return;
        }
        
        // Calculate new dimensions (max 1600px width or height)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1600;
        
        if (width > height && width > maxDimension) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with better quality settings
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with reduced quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image: Canvas could not produce a blob'));
            return;
          }
          
          const newFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          // Log compression stats
          console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(newFile.size / 1024).toFixed(1)}KB (${Math.round((newFile.size / file.size) * 100)}%)`);
          
          resolve(newFile);
        }, 'image/jpeg', 0.8); // 80% quality JPEG
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
    };
    
    reader.onerror = (error) => {
      reject(new Error(`Failed to read image file: ${error}`));
    };
  });
};
