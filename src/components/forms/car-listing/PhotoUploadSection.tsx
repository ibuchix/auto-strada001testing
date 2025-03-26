
/**
 * Changes made:
 * - 2024-08-09: Enhanced to use categorized Supabase Storage
 * - 2024-08-09: Added upload progress tracking
 * - 2024-08-17: Updated imports to use refactored photo upload hook
 * - 2024-12-27: Fixed handleFileUpload to return a Promise<string | null>
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { RequiredPhotos } from "./photo-upload/RequiredPhotos";
import { AdditionalPhotos } from "./photo-upload/AdditionalPhotos";
import { usePhotoUpload } from "./photo-upload/usePhotoUpload";
import { PhotoUploadSectionProps } from "./photo-upload/types";
import { useEffect, useState } from "react";
import { UploadProgress } from "./UploadProgress";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera } from "lucide-react";

interface ExtendedPhotoUploadSectionProps extends PhotoUploadSectionProps {
  onProgressUpdate?: (progress: number) => void;
}

export const PhotoUploadSection = ({ form, carId, onProgressUpdate }: ExtendedPhotoUploadSectionProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { 
    isUploading, 
    uploadedPhotos, 
    setUploadedPhotos, 
    uploadProgress: hookProgress 
  } = usePhotoUpload({ 
    carId: carId,
    category: 'exterior', // Default category
    onProgressUpdate: setUploadProgress
  });

  useEffect(() => {
    if (uploadedPhotos.length > 0) {
      form.setValue('uploadedPhotos', uploadedPhotos);
    }
  }, [uploadedPhotos, form]);

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(uploadProgress);
    }
  }, [uploadProgress, onProgressUpdate]);

  const handleFileUpload = async (file: File, type: string): Promise<string | null> => {
    // This is just a placeholder since we're using the hook's functionality directly
    setUploadProgress(prev => Math.min(prev + 10, 100));
    // Return null as we're not actually uploading in this function - the hook does that
    return null;
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-dark">Vehicle Photos</h2>
      
      <Alert className="mb-4 border-secondary/20 bg-secondary/5">
        <Camera className="h-4 w-4 text-secondary" />
        <AlertDescription className="ml-2">
          Please provide clear photos of your vehicle. High-quality images will help attract more potential buyers.
        </AlertDescription>
      </Alert>
      
      <RequiredPhotos
        isUploading={isUploading}
        onFileSelect={handleFileUpload}
        progress={uploadProgress}
      />
      
      <UploadProgress progress={hookProgress} />
      
      <AdditionalPhotos
        isUploading={isUploading}
        onFilesSelect={(files) => {
          files.forEach(async (file) => {
            await handleFileUpload(file, 'additional');
          });
        }}
      />
    </Card>
  );
};
