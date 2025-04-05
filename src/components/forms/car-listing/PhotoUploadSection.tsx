
/**
 * Component for uploading photos to a car listing
 * Changes made:
 * - 2025-04-05: Refactored into smaller components for better maintainability
 * - 2025-04-05: Extracted AlertMessage component, usePhotoUploadSection hook
 * - 2025-04-05: Enhanced structure and separation of concerns
 */
import React from 'react';
import { useFormData } from './context/FormDataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePhotoUpload } from './photo-upload/hooks';
import { usePhotoUploadSection } from './photo-upload/hooks/usePhotoUploadSection';
import { FormSection } from './FormSection';
import { SaveButton } from './SaveButton';
import { AlertMessage } from './photo-upload/components/AlertMessage';
import { CurrentPhotosDisplay } from './photo-upload/CurrentPhotosDisplay';
import { AdditionalPhotosUploader } from './photo-upload/AdditionalPhotosUploader';
import { RequiredPhotos } from './photo-upload/RequiredPhotos';

interface PhotoUploadProps {
  carId?: string;
  onValidate?: () => Promise<boolean>;
}

export const PhotoUploadSection = ({ 
  carId, 
  onValidate 
}: PhotoUploadProps) => {
  const { form } = useFormData();
  const isMobile = useIsMobile();
  
  // Use the extract hook for state and handlers
  const {
    savingProgress,
    uploadError,
    savedSuccess,
    watchedPhotos,
    handleValidationChange,
    handlePhotoUpload,
    handleFileSelect,
    handleRemovePhoto,
    handleSavePhotos,
    clearError,
    clearSuccess
  } = usePhotoUploadSection({
    form,
    carId,
    onValidate
  });

  // Get photo upload state from the hook
  const {
    isUploading,
    uploadProgress,
    setUploadedPhotos,
  } = usePhotoUpload({
    carId,
    category: 'additional',
  });

  // Handler for photo removal that updates both contexts
  const onRemovePhoto = (photoUrl: string) => {
    handleRemovePhoto(photoUrl);
    setUploadedPhotos(prev => prev.filter(url => url !== photoUrl));
  };

  return (
    <FormSection 
      title="Photos"
      subtitle="Upload photos of your vehicle"
      right={
        <SaveButton
          onClick={handleSavePhotos}
          isLoading={savingProgress}
          label="Save Photos"
          className={isMobile ? "px-4 py-2 text-sm" : ""}
        />
      }
    >
      {/* Error Alert */}
      {uploadError && (
        <AlertMessage
          type="error"
          message={uploadError.message}
          description={uploadError.description}
          onClose={clearError}
        />
      )}
      
      {/* Success Alert */}
      {savedSuccess && (
        <AlertMessage
          type="success"
          message="Photos saved successfully"
          onClose={clearSuccess}
        />
      )}

      {/* Required Photos with validation */}
      <RequiredPhotos
        isUploading={isUploading}
        progress={uploadProgress}
        onFileSelect={handleFileSelect}
        onValidationChange={handleValidationChange}
      />
      
      {/* Current Photos Display */}
      <CurrentPhotosDisplay 
        photos={watchedPhotos}
        onRemovePhoto={onRemovePhoto}
      />

      {/* Additional Photos Uploader */}
      <AdditionalPhotosUploader
        isUploading={isUploading}
        onPhotosSelected={handlePhotoUpload}
        progress={uploadProgress}
        error={uploadError}
      />
    </FormSection>
  );
};
