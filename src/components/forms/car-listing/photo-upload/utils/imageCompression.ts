/**
 * Image compression utility
 * Created: 2025-05-19 - Added to improve upload performance
 */

/**
 * Compresses an image file to reduce its size
 * This helps with faster uploads and lower storage usage
 */
export const compressImage = async (file: File, targetSizeMB: number = 2): Promise<File> => {
  // If file is already smaller than target size, return it as is
  if (file.size <= targetSizeMB * 1024 * 1024) {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Create a FileReader to read the image file
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // Create an image element to load the file
        const img = new Image();
        
        img.onload = () => {
          try {
            // Calculate compression ratio based on file size
            const originalSizeMB = file.size / (1024 * 1024);
            let quality = Math.min(0.9, targetSizeMB / originalSizeMB);
            
            // Ensure quality is reasonable (between 0.3 and 0.9)
            quality = Math.max(0.3, quality);
            
            // Create a canvas to draw the image
            const canvas = document.createElement('canvas');
            
            // Keep original dimensions but limit max size to prevent memory issues
            const maxDimension = 2000;
            let width = img.width;
            let height = img.height;
            
            // Scale down if image is too large
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw image on canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert canvas to Blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                
                // Create new file from Blob
                const compressedFile = new File(
                  [blob],
                  file.name,
                  {
                    type: 'image/jpeg', // Convert to JPEG for better compression
                    lastModified: file.lastModified
                  }
                );
                
                console.log(`Compressed ${file.name} from ${(file.size / 1024).toFixed(2)} KB to ${(compressedFile.size / 1024).toFixed(2)} KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
                
                resolve(compressedFile);
              },
              'image/jpeg',
              quality
            );
          } catch (error) {
            console.error('Error during image compression:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        // Set the image source to the loaded file
        img.src = event.target.result.toString();
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error in image compression:', error);
      reject(error);
    }
  });
};

export default compressImage;
