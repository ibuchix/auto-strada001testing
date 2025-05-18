
/**
 * RimPhotosSection component
 * Created: 2025-05-04
 * Purpose: Handles the upload and display of rim photos
 * Updated: 2025-08-28 - Fixed type compatibility with PhotoUploaderProps
 * Updated: 2025-08-28 - Improved design consistency with main photo section
 * Updated: 2025-05-19 - Fixed React hooks related issues causing error #310
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Predefined empty states - no conditional hook calls
const emptyUploads = { front_left: false, front_right: false, rear_left: false, rear_right: false };
const emptyActiveUploads = { front_left: false, front_right: false, rear_left: false, rear_right: false };

export const RimPhotosSection = () => {
  // Component now renders PhotoSection directly using a stable functional pattern
  return (
    <SafeFormWrapper>
      {(form) => {
        // Define all form handlers here with stable references
        const handleFileUpload = async (file: File, position: string) => {
          try {
            // Create a preview of the image
            const reader = new FileReader();
            
            const result = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            // Update form data with image
            setRimPhotoField(position, result, form.setValue);
            
            return result;
          } catch (error) {
            console.error(`Error uploading ${position} rim photo:`, error);
            throw error;
          }
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
                uploadedPhotos={emptyUploads}
                activeUploads={emptyActiveUploads}
                progress={0}
                onFileSelect={handleFileUpload}
                onPhotoUploaded={() => {}}
                onUploadError={() => {}}
                onUploadRetry={() => {}}
              />
            </CardContent>
          </Card>
        );
      }}
    </SafeFormWrapper>
  );
};
