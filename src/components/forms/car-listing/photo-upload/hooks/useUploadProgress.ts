
/**
 * Hook to manage upload progress
 */
import { useState, useEffect } from 'react';

export const useUploadProgress = (onProgressUpdate?: (progress: number) => void) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  // Call the progress update callback whenever progress changes
  useEffect(() => {
    if (onProgressUpdate && uploadProgress > 0) {
      onProgressUpdate(uploadProgress);
    }
  }, [uploadProgress, onProgressUpdate]);

  return {
    uploadProgress,
    setUploadProgress
  };
};
