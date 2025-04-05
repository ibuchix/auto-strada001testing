
/**
 * Hook to manage upload state
 */
import { useState } from 'react';

export const useUploadState = () => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  return {
    uploadedPhotos,
    setUploadedPhotos,
    isUploading,
    setIsUploading,
    uploadError,
    setUploadError,
    currentFile,
    setCurrentFile
  };
};
