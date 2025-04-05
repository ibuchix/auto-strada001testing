
/**
 * Component for uploading photos to a car listing
 * Changes made:
 * - Added validation to ensure all required photos are uploaded
 * - Added onValidationChange callback for form integration
 * - Updated to display validation errors when trying to proceed
 * - Enhanced with better error handling and user feedback
 */
import React, { useState, useEffect } from 'react';
import { usePhotoUpload } from './photo-upload/hooks';
import { FormSection } from './FormSection';
import { SaveButton } from './SaveButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { CurrentPhotosDisplay } from './photo-upload/CurrentPhotosDisplay';
import { AdditionalPhotosUploader } from './photo-upload/AdditionalPhotosUploader';
import { PhotoUploadError, PhotoUploadSectionProps } from './photo-upload/types';
import { useFormData } from './context/FormDataContext';
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
  const [savingProgress, setSavingProgress] = useState(false);
  const [uploadError, setUploadError] = useState<PhotoUploadError | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPhotoSectionValid, setIsPhotoSectionValid] = useState(false);
  const watchedPhotos = form.watch('uploadedPhotos') || [];
  const isMobile = useIsMobile();

  const {
    isUploading,
    uploadProgress,
    uploadedPhotos,
    setUploadedPhotos,
    resetUploadState,
    uploadError: photoUploadError
  } = usePhotoUpload({
    carId,
    category: 'additional',
    onProgressUpdate: (progress) => {
      // Update progress if needed
    }
  });

  // Update form when photo section validation changes
  const handleValidationChange = (isValid: boolean) => {
    setIsPhotoSectionValid(isValid);
    form.setValue('photoValidationPassed', isValid, { 
      shouldValidate: true,
      shouldDirty: true 
    });
  };

  const handlePhotoUpload = async (files: File[]) => {
    try {
      setUploadError(null);
      // Logic to handle the upload
      // This would update the form's uploadedPhotos field
      
      if (files.length === 0) {
        setUploadError({
          message: "No files selected",
          description: "Please select at least one photo to upload."
        });
        return;
      }
      
      // Placeholder for upload logic
      console.log(`Uploading ${files.length} photos...`);
      
      // If there was an error in the upload process, set it
      if (photoUploadError) {
        setUploadError({
          message: "Upload failed",
          description: photoUploadError
        });
      }
    } catch (error: any) {
      setUploadError({
        message: "Error uploading photos",
        description: error.message || "There was a problem uploading your photos. Please try again."
      });
      console.error(error);
    }
  };

  const handleFileSelect = async (file: File, type: string): Promise<string | null> => {
    try {
      // Any additional processing...
      
      // Return the file URL if successful
      return "https://example.com/photo.jpg";
    } catch (error) {
      console.error("Error selecting file:", error);
      return null;
    }
  };

  const handleRemovePhoto = (photoUrl: string) => {
    const currentPhotos = form.getValues('uploadedPhotos') || [];
    const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);
    form.setValue('uploadedPhotos', updatedPhotos, {
      shouldValidate: true,
      shouldDirty: true
    });
    setUploadedPhotos(prev => prev.filter(url => url !== photoUrl));
  };

  const handleSavePhotos = async () => {
    try {
      setSavingProgress(true);
      setSavedSuccess(false);
      setUploadError(null);
      
      // Validate required photos first
      if (!isPhotoSectionValid) {
        setUploadError({
          message: "Missing Required Photos",
          description: "Please upload all required photos before saving."
        });
        return;
      }
      
      // If onValidate is provided, run validation
      if (onValidate) {
        const isValid = await onValidate();
        if (!isValid) {
          setUploadError({
            message: "Validation Failed",
            description: "Please correct the validation errors before proceeding."
          });
          return;
        }
      }
      
      // Save logic here
      // Just a delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSavedSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (error: any) {
      setUploadError({
        message: "Error saving photos",
        description: error.message || "There was a problem saving your photos. Please try again."
      });
      console.error(error);
    } finally {
      setSavingProgress(false);
    }
  };

  const clearError = () => {
    setUploadError(null);
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
      {uploadError && (
        <Alert variant="destructive" className="mb-4">
          <div className="flex justify-between w-full">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <AlertTitle>{uploadError.message}</AlertTitle>
                {uploadError.description && (
                  <AlertDescription>{uploadError.description}</AlertDescription>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={clearError}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}
      
      {savedSuccess && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <div className="flex justify-between w-full">
            <div className="flex items-start gap-2 text-green-700">
              <div>Photos saved successfully</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setSavedSuccess(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
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
        onRemovePhoto={handleRemovePhoto}
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
