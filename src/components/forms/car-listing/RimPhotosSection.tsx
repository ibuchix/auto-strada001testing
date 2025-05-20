
/**
 * RimPhotosSection component
 * Created: 2025-05-04
 * Updated: 2025-08-28 - Fixed type compatibility with PhotoUploaderProps
 * Updated: 2025-08-28 - Improved design consistency with main photo section
 * Updated: 2025-05-19 - Fixed React hooks related issues causing error #310
 * Updated: 2025-05-20 - Implemented proper state management and upload handling
 * Updated: 2025-05-21 - Fixed rim photo upload functionality and error handling
 * Updated: 2025-05-29 - Fixed form object passing to photo helper functions
 * Updated: 2025-05-30 - Implemented improved error handling and type safety
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { setRimPhotoField } from './utilities/photoHelpers';
import { SafeFormWrapper } from './SafeFormWrapper';
import { Layers } from 'lucide-react';
import { PhotoSection } from './photo-upload/components/PhotoSection';
import { toast } from 'sonner';

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
  // Active state management for uploads
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({});
  const [activeUploads, setActiveUploads] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  return (
    <SafeFormWrapper>
      {(form) => {
        // Load initial state from form values
        useEffect(() => {
          try {
            const formValues = form.getValues();
            const currentRimPhotos = formValues.rimPhotos || {};
            
            // Set initial state based on existing form values
            const initialUploadState: Record<string, boolean> = {};
            
            // Check each rim position for existing photos
            rimPositions.forEach(position => {
              const photoUrl = currentRimPhotos[position.id];
              initialUploadState[position.id] = !!photoUrl;
            });
            
            setUploadedPhotos(initialUploadState);
          } catch (error) {
            console.error('Error initializing rim photos from form:', error);
          }
        }, [form]);
        
        // Handle file upload
        const handleFileUpload = async (file: File, position: string): Promise<string> => {
          try {
            // Validate inputs
            if (!file) {
              throw new Error('No file provided for upload');
            }
            
            if (!position) {
              throw new Error('No position specified for upload');
            }
            
            // Mark upload as active
            setActiveUploads(prev => ({ ...prev, [position]: true }));
            
            // Clear any previous errors
            setUploadErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[position];
              return newErrors;
            });
            
            // Simulate upload progress (in real implementation, this would track actual upload)
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += 10;
              setUploadProgress(Math.min(progress, 90));
              if (progress >= 90) clearInterval(progressInterval);
            }, 100);
            
            // Create a preview of the image
            const reader = new FileReader();
            
            const result = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            // Update form data with image - pass the entire form object
            setRimPhotoField(position, result, form);
            
            // Complete the progress bar
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            // Mark upload as complete
            setTimeout(() => {
              setUploadedPhotos(prev => ({ ...prev, [position]: true }));
              setActiveUploads(prev => {
                const newState = { ...prev };
                delete newState[position];
                return newState;
              });
              setUploadProgress(0);
            }, 300);
            
            // Show success toast
            toast.success(`${position.replace('_', ' ')} photo uploaded`);
            
            return result;
          } catch (error) {
            console.error(`Error uploading ${position} rim photo:`, error);
            
            // Handle the error state
            setUploadErrors(prev => ({ 
              ...prev, 
              [position]: error instanceof Error ? error.message : 'Upload failed'
            }));
            
            // Clear active upload state
            setActiveUploads(prev => {
              const newState = { ...prev };
              delete newState[position];
              return newState;
            });
            
            // Show error toast
            toast.error(`Failed to upload ${position.replace('_', ' ')} photo`, {
              description: error instanceof Error ? error.message : 'Unknown error'
            });
            
            throw error;
          }
        };
        
        // Handle successful upload
        const handlePhotoUploaded = (position: string) => {
          setUploadedPhotos(prev => ({ ...prev, [position]: true }));
          
          // Update form field
          const rimPhotos = form.getValues().rimPhotos || {};
          form.setValue('rimPhotos', { ...rimPhotos }, { shouldDirty: true });
        };
        
        // Handle upload error
        const handleUploadError = (position: string, errorMessage: string) => {
          setUploadErrors(prev => ({ ...prev, [position]: errorMessage }));
          setActiveUploads(prev => {
            const newState = { ...prev };
            delete newState[position];
            return newState;
          });
        };
        
        // Handle retry
        const handleUploadRetry = (position: string) => {
          // Clear the error for this position
          setUploadErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[position];
            return newErrors;
          });
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
                progress={uploadProgress}
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
