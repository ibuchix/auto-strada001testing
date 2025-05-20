
/**
 * Photo upload content component
 * Created: 2025-05-20
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { FormLabel } from "../../FormSection";
import { PhotoUploadCard } from './components/PhotoUploadCard';
import { RequirementsCard } from './components/RequirementsCard'; 
import { UploadedPhotosGrid } from './components/UploadedPhotosGrid';
import { usePhotoUploadState } from './hooks/usePhotoUploadState';
import { usePhotoUploadHandlers } from './hooks/usePhotoUploadHandlers';

interface PhotoUploadContentProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const PhotoUploadContent: React.FC<PhotoUploadContentProps> = ({
  form,
  carId
}) => {
  const { state, uploaders } = usePhotoUploadState({ form });
  const { handleUpload, removePhoto } = usePhotoUploadHandlers({ 
    form, 
    state, 
    uploaders 
  });
  
  const handleSelectFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => handleUpload((e.target as HTMLInputElement).files);
    input.click();
  };
  
  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Vehicle Photos</FormLabel>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos of your vehicle. Clear photos help your listing get more attention.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PhotoUploadCard 
          isUploading={state.isUploading}
          uploadProgress={state.uploadProgress}
          onSelectFiles={handleSelectFiles}
        />
        <RequirementsCard />
      </div>
      
      <UploadedPhotosGrid 
        photos={state.uploadedPhotos}
        onRemovePhoto={removePhoto}
      />
    </div>
  );
};
