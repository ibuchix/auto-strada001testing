
/**
 * RimPhotosSection component
 * Created: 2025-05-04
 * Purpose: Handles the upload and display of rim photos
 * Updated: 2025-08-28 - Fixed type compatibility with PhotoUploaderProps
 * Updated: 2025-08-28 - Improved design consistency with main photo section
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFormData } from './context/FormDataContext';
import { useTemporaryFileUpload } from '@/hooks/useTemporaryFileUpload';
import { setRimPhotoField } from './utilities/photoHelpers';
import { SafeFormWrapper } from './SafeFormWrapper';
import { Layers } from 'lucide-react';
import { PhotoSection } from './photo-upload/components/PhotoSection';

interface RimPosition {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

const rimPositions: RimPosition[] = [
  { id: 'front_left', title: 'Front Left Rim', description: 'Front left wheel rim', required: true },
  { id: 'front_right', title: 'Front Right Rim', description: 'Front right wheel rim', required: true },
  { id: 'rear_left', title: 'Rear Left Rim', description: 'Rear left wheel rim', required: true },
  { id: 'rear_right', title: 'Rear Right Rim', description: 'Rear right wheel rim', required: true }
];

export const RimPhotosSection = () => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({});
  const [activeUploads, setActiveUploads] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<number>(0);
  
  return (
    <SafeFormWrapper>
      {(form) => {
        // Handle file upload for each rim position
        const handleFileUpload = async (file: File, position: string) => {
          try {
            setActiveUploads(prev => ({ ...prev, [position]: true }));
            
            // Create a preview of the image
            const reader = new FileReader();
            
            const result = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            // Update form data with image
            setRimPhotoField(position, result, form.setValue);
            
            // Update upload status
            setUploadedPhotos(prev => ({ ...prev, [position]: true }));
            
            return result;
          } catch (error) {
            console.error(`Error uploading ${position} rim photo:`, error);
            throw error;
          } finally {
            setActiveUploads(prev => ({ ...prev, [position]: false }));
          }
        };
        
        // Handle completion of upload
        const handlePhotoUploaded = (position: string) => {
          setUploadedPhotos(prev => ({ ...prev, [position]: true }));
        };
        
        // Handle upload error
        const handleUploadError = (position: string, error: string) => {
          console.error(`Error uploading ${position}:`, error);
          setActiveUploads(prev => ({ ...prev, [position]: false }));
        };
        
        // Handle retry of upload
        const handleUploadRetry = (position: string) => {
          setActiveUploads(prev => ({ ...prev, [position]: false }));
        };
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <span>Wheel Rim Photos</span>
              </CardTitle>
              <CardDescription>
                Please upload clear photos of all four wheel rims to document their condition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoSection
                title="Wheel Rims"
                description="Upload clear photos of all four wheel rims"
                icon={Layers}
                photos={rimPositions}
                uploadedPhotos={uploadedPhotos}
                activeUploads={activeUploads}
                progress={progress}
                onFileSelect={handleFileUpload}
                onPhotoUploaded={handlePhotoUploaded}
                onUploadError={handleUploadError}
                onUploadRetry={handleUploadRetry}
              />
            </CardContent>
          </Card>
        );
      }}
    </SafeFormWrapper>
  );
};
