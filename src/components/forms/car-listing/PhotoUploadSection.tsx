
/**
 * Component for uploading photos to a car listing
 * Changes made:
 * - Updated to use typed StepComponentProps
 * - Added validation support
 * - Fixed FormSection usage by adding required title prop
 * - Improved TypeScript typing
 * - Replaced toast notifications with persistent error messages
 */
import React, { useState } from 'react';
import { usePhotoUpload } from '../car-listing/photo-upload/usePhotoUpload';
import { FormSectionHeader } from './FormSectionHeader';
import { FormSection } from './FormSection';
import { SaveButton } from './SaveButton';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
  userId?: string;
  onValidate?: () => Promise<boolean>;
}

interface PhotoUploadError {
  message: string;
  description?: string;
}

// AdditionalPhotos component with correct props
interface AdditionalPhotosProps {
  isUploading: boolean;
  onPhotosSelected: (files: File[]) => Promise<void>;
  progress: number;
  error: PhotoUploadError | null;
}

const AdditionalPhotos = ({ isUploading, onPhotosSelected, progress, error }: AdditionalPhotosProps) => {
  const handleDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await onPhotosSelected(acceptedFiles);
  };

  return (
    <div className="mt-4">
      <h4 className="text-base font-medium mb-2">Additional Photos</h4>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.message}</AlertTitle>
          {error.description && <AlertDescription>{error.description}</AlertDescription>}
        </Alert>
      )}
      
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => {
          // Simulate click on file input
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = 'image/*';
          input.onchange = (e: any) => {
            if (e.target.files) {
              handleDrop(Array.from(e.target.files));
            }
          };
          input.click();
        }}
      >
        {isUploading ? (
          <div>
            <p className="text-sm text-gray-500 mb-1">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">Drag & drop photos here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WEBP (max 10MB)</p>
          </>
        )}
      </div>
    </div>
  );
};

const CurrentPhotos = ({ photos, onRemovePhoto }: { photos: string[], onRemovePhoto?: (url: string) => void }) => {
  if (photos.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-base font-medium mb-2">Current Photos</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <Card key={index} className="relative overflow-hidden aspect-square">
            <img
              src={photo}
              alt={`Car photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {onRemovePhoto && (
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-70 hover:opacity-100"
                onClick={() => onRemovePhoto(photo)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export const PhotoUploadSection = ({ 
  form, 
  carId, 
  onValidate 
}: PhotoUploadSectionProps) => {
  const [savingProgress, setSavingProgress] = useState(false);
  const [uploadError, setUploadError] = useState<PhotoUploadError | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const watchedPhotos = form.watch('uploadedPhotos') || [];

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
      
      // If onValidate is provided, run validation
      if (onValidate) {
        const isValid = await onValidate();
        if (!isValid) {
          setUploadError({
            message: "Validation Failed",
            description: "Please upload at least 3 photos"
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

      <CurrentPhotos 
        photos={watchedPhotos}
        onRemovePhoto={handleRemovePhoto} 
      />

      <AdditionalPhotos
        isUploading={isUploading}
        onPhotosSelected={handlePhotoUpload}
        progress={uploadProgress}
        error={uploadError}
      />
    </FormSection>
  );
};
