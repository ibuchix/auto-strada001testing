
/**
 * RimPhotoContent component
 * Created: 2025-05-20
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { PhotoSection } from '../photo-upload/components/PhotoSection';
import { rimPositions } from './constants';
import { RimPhotoState, RimPhotoHandlers } from './types';

interface RimPhotoContentProps {
  state: RimPhotoState;
  handlers: RimPhotoHandlers;
}

export const RimPhotoContent: React.FC<RimPhotoContentProps> = ({ 
  state, 
  handlers 
}) => {
  const { uploadedPhotos, activeUploads, uploadProgress } = state;
  const { handleFileUpload, handlePhotoUploaded, handleUploadError, handleUploadRetry } = handlers;
  
  return (
    <CardContent>
      <PhotoSection
        title="Wheel Rims"
        description="Upload clear photos of all four wheel rims"
        icon={Layers}
        photos={rimPositions}
        uploadedPhotos={uploadedPhotos}
        activeUploads={activeUploads}
        progress={uploadProgress}
        onFileSelect={handleFileUpload}
        onPhotoUploaded={handlePhotoUploaded}
        onUploadError={handleUploadError}
        onUploadRetry={handleUploadRetry}
      />
    </CardContent>
  );
};
