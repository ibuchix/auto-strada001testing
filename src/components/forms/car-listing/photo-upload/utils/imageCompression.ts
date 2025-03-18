
/**
 * Changes made:
 * - 2024-08-17: Extracted image compression logic into a separate utility
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
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with reduced quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          const newFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(newFile);
        }, 'image/jpeg', 0.8); // 80% quality JPEG
      };
    };
    reader.onerror = (error) => reject(error);
  });
};
