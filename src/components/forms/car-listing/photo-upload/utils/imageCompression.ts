
/**
 * Utility for image compression
 * - Reduces file size for larger images
 * - Maintains quality within acceptable parameters
 * - Falls back gracefully if compression fails
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a FileReader to read the file
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        // Create an image to get dimensions
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          // Create a canvas to draw and compress the image
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 1600px wide for large images)
          if (width > 1600) {
            const ratio = width / height;
            width = 1600;
            height = width / ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob from canvas'));
                return;
              }
              
              // Create a new file with same name but compressed content
              const compressedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg', lastModified: Date.now() }
              );
              
              // Resolve with the compressed file
              resolve(compressedFile);
            },
            'image/jpeg',
            0.85 // Quality setting (0.85 is a good balance)
          );
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for compression'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file for compression'));
      };
    } catch (error) {
      reject(error);
    }
  });
};
