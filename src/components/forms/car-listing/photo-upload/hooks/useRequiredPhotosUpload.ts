
/**
 * Hook to manage the state and functions for required photos uploading
 * Changes made:
 * - Added validation integration with onValidationChange callback
 * - Enhanced state persistence with localStorage
 * - Added detailed logging for debugging
 */
import { useState, useEffect } from "react";
import { ValidationError } from "../../utils/validation";

interface UseRequiredPhotosUploadProps {
  onValidationChange?: (isValid: boolean) => void;
}

export const useRequiredPhotosUpload = ({ onValidationChange }: UseRequiredPhotosUploadProps = {}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({
    exterior_front: false,
    exterior_rear: false,
    exterior_driver: false,
    exterior_passenger: false,
    interior_front: false,
    interior_rear: false,
    dashboard: false,
    odometer: false,
  });
  
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [activeUploads, setActiveUploads] = useState<Record<string, boolean>>({});

  // Check for any previously uploaded photos in localStorage
  useEffect(() => {
    if (!recoveryAttempted) {
      try {
        const savedPhotos = localStorage.getItem('uploadedRequiredPhotos');
        if (savedPhotos) {
          const parsedPhotos = JSON.parse(savedPhotos);
          setUploadedPhotos(prev => ({
            ...prev,
            ...parsedPhotos
          }));
          setRecoveryAttempted(true);
        }
      } catch (error) {
        console.error('Failed to recover photos', error);
      }
    }
  }, [recoveryAttempted]);

  // Save upload state to localStorage
  useEffect(() => {
    // Only save if we have at least one uploaded photo
    if (Object.values(uploadedPhotos).some(Boolean)) {
      localStorage.setItem('uploadedRequiredPhotos', JSON.stringify(uploadedPhotos));
    }
  }, [uploadedPhotos]);

  // Validate and notify parent
  useEffect(() => {
    const isValid = Object.values(uploadedPhotos).every(Boolean);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [uploadedPhotos, onValidationChange]);

  const handlePhotoUploaded = (type: string) => {
    setUploadedPhotos((prev) => {
      return { ...prev, [type]: true };
    });
    
    // Clear any errors for this photo
    if (uploadErrors[type]) {
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    }
    
    // Remove from active uploads
    setActiveUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[type];
      return newUploads;
    });
  };
  
  const handleUploadError = (type: string, error: string) => {
    setUploadErrors(prev => ({
      ...prev,
      [type]: error
    }));
    
    // Remove from active uploads
    setActiveUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[type];
      return newUploads;
    });
  };

  const handleUploadRetry = (type: string) => {
    // Clear any errors for this photo
    if (uploadErrors[type]) {
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    }
  };

  // Get completion percentage
  const getCompletionPercentage = () => {
    const totalPhotos = Object.keys(uploadedPhotos).length;
    const completedPhotos = Object.values(uploadedPhotos).filter(Boolean).length;
    return Math.round((completedPhotos / totalPhotos) * 100);
  };

  const setActiveUpload = (type: string) => {
    setActiveUploads(prev => ({
      ...prev,
      [type]: true
    }));
  };

  return {
    uploadedPhotos,
    uploadErrors,
    activeUploads,
    handlePhotoUploaded,
    handleUploadError,
    handleUploadRetry,
    getCompletionPercentage,
    setActiveUpload
  };
};
