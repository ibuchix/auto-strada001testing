
/**
 * Additional Photos Component
 * Updated: 2025-05-30 - Phase 5: Simplified for direct submission
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';
import { usePhotoUploadState } from './hooks/usePhotoUploadState';
import { usePhotoUploadHandlers } from './hooks/usePhotoUploadHandlers';
import { useFormContext } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

interface AdditionalPhotosProps {
  isUploading?: boolean;
  onFilesSelect?: (files: File[] | FileList) => void;
}

export const AdditionalPhotos: React.FC<AdditionalPhotosProps> = ({
  isUploading = false
}) => {
  const form = useFormContext<CarListingFormData>();
  const uploadState = usePhotoUploadState({ form });
  const handlers = usePhotoUploadHandlers({ form, uploadState });
  
  const { files } = uploadState;
  const additionalPhotos = files.additionalPhotos;
  
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handlers.handleMultiplePhotoUpload(selectedFiles);
    }
    // Reset input
    event.target.value = '';
  };
  
  const handleRemovePhoto = (index: number) => {
    handlers.removePhoto('setAdditionalPhotos', index);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Additional Photos ({additionalPhotos.length}/10)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Upload up to 10 additional photos to showcase your vehicle's unique features, 
          condition details, or special equipment.
        </p>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
              disabled={isUploading || additionalPhotos.length >= 10}
            />
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload additional photos
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG up to 10MB each
              </p>
            </div>
          </label>
        </div>
        
        {/* Uploaded Photos Grid */}
        {additionalPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {additionalPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo.preview}
                  alt={`Additional photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {additionalPhotos.length >= 10 && (
          <p className="text-sm text-amber-600">
            Maximum of 10 additional photos reached.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
