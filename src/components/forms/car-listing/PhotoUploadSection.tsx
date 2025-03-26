
/**
 * Component for uploading photos to a car listing
 */
import React, { useState } from 'react';
import { usePhotoUpload } from '../car-listing/photo-upload/usePhotoUpload';
import { FormSectionHeader } from './FormSectionHeader';
import { FormSection } from './FormSection';
import { SaveButton } from './SaveButton';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';

interface PhotoUploadSectionProps {
  form: UseFormReturn<any>;
  carId?: string;
}

// AdditionalPhotos component with correct props
interface AdditionalPhotosProps {
  isUploading: boolean;
  onPhotosSelected: (files: File[]) => Promise<void>;
  progress: number;
}

const AdditionalPhotos = ({ isUploading, onPhotosSelected, progress }: AdditionalPhotosProps) => {
  const handleDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await onPhotosSelected(acceptedFiles);
  };

  return (
    <div className="mt-4">
      <h4 className="text-base font-medium mb-2">Additional Photos</h4>
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

const CurrentPhotos = ({ photos }: { photos: string[] }) => {
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
          </Card>
        ))}
      </div>
    </div>
  );
};

export const PhotoUploadSection = ({ form, carId }: PhotoUploadSectionProps) => {
  const [savingProgress, setSavingProgress] = useState(false);
  const watchedPhotos = form.watch('uploadedPhotos') || [];

  const {
    isUploading,
    uploadProgress,
    uploadedPhotos,
    setUploadedPhotos,
    resetUploadState
  } = usePhotoUpload({
    carId,
    category: 'additional',
    onProgressUpdate: (progress) => {
      // Update progress if needed
    }
  });

  const handlePhotoUpload = async (files: File[]) => {
    // Process and upload the files
    try {
      toast.info(`Uploading ${files.length} photos...`);
      // Logic to handle the upload
      // This would update the form's uploadedPhotos field
    } catch (error) {
      toast.error('Error uploading photos');
      console.error(error);
    }
  };

  const handleSavePhotos = async () => {
    try {
      setSavingProgress(true);
      // Save logic here
      toast.success('Photos saved successfully');
    } catch (error) {
      toast.error('Error saving photos');
      console.error(error);
    } finally {
      setSavingProgress(false);
    }
  };

  return (
    <FormSection>
      <FormSectionHeader
        title="Photos"
        subtitle="Upload photos of your vehicle"
        right={
          <SaveButton
            onClick={handleSavePhotos}
            isLoading={savingProgress}
            label="Save Photos"
          />
        }
      />

      <CurrentPhotos photos={watchedPhotos} />

      <AdditionalPhotos
        isUploading={isUploading}
        onPhotosSelected={handlePhotoUpload}
        progress={uploadProgress}
      />
    </FormSection>
  );
};
