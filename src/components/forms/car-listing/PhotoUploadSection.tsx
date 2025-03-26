
/**
 * Changes made:
 * - 2024-08-09: Enhanced to use categorized Supabase Storage
 * - 2024-08-09: Added upload progress tracking
 * - 2024-08-17: Updated imports to use refactored photo upload hook
 * - 2024-12-27: Fixed handleFileUpload to return a Promise<string | null>
 * - 2025-05-03: Added diagnosticId support and recovery mechanisms
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
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveToCache } from "@/services/offlineCacheService";

interface ExtendedPhotoUploadSectionProps extends PhotoUploadSectionProps {
  onProgressUpdate?: (progress: number) => void;
  diagnosticId?: string;
}

export const PhotoUploadSection = ({ 
  form, 
  carId, 
  onProgressUpdate,
  diagnosticId 
}: ExtendedPhotoUploadSectionProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attemptingRecovery, setAttemptingRecovery] = useState(false);
  
  const { 
    isUploading, 
    uploadedPhotos, 
    setUploadedPhotos, 
    uploadProgress: hookProgress,
    uploadFile,
    resetUploadState
  } = usePhotoUpload({ 
    carId: carId,
    category: 'exterior', 
    onProgressUpdate: setUploadProgress,
    diagnosticId
  });

  // Log diagnostic information
  const logDiagnostic = (event: string, data: any = {}) => {
    if (diagnosticId) {
      console.log(`[${diagnosticId}] [PhotoUploadSection] ${event}:`, {
        ...data,
        timestamp: new Date().toISOString(),
        carId,
        uploadProgress,
        hookProgress,
        isUploading
      });
    }
  };

  useEffect(() => {
    logDiagnostic('Component mounted');
    return () => {
      logDiagnostic('Component unmounted');
    };
  }, []);

  useEffect(() => {
    if (uploadedPhotos.length > 0) {
      logDiagnostic('Saving uploadedPhotos to form', { count: uploadedPhotos.length });
      form.setValue('uploadedPhotos', uploadedPhotos);
      
      // Persist to localStorage as a backup
      try {
        saveToCache('uploadedPhotos', uploadedPhotos);
        logDiagnostic('Saved uploadedPhotos to cache');
      } catch (error) {
        logDiagnostic('Failed to save uploadedPhotos to cache', { error });
      }
    }
  }, [uploadedPhotos, form]);

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(uploadProgress);
    }
  }, [uploadProgress, onProgressUpdate]);

  const handleFileUpload = async (file: File, type: string): Promise<string | null> => {
    logDiagnostic('handleFileUpload called', { type, fileName: file.name });
    
    try {
      setUploadError(null);
      const uploadPath = `${carId || 'temp'}/${type}/${file.name}`;
      const url = await uploadFile(file, uploadPath);
      
      if (url) {
        logDiagnostic('File upload success', { type, url });
        return url;
      } else {
        logDiagnostic('File upload returned null', { type });
        setUploadError(`Upload failed for ${type}`);
        return null;
      }
    } catch (error) {
      logDiagnostic('File upload error', { type, error });
      setUploadError(`Error uploading ${type}: ${error}`);
      return null;
    }
  };

  const handleRetryUploads = () => {
    logDiagnostic('Retry uploads clicked');
    setAttemptingRecovery(true);
    
    // Reset error state
    setUploadError(null);
    
    // Reset upload progress
    setUploadProgress(0);
    resetUploadState();
    
    // Give a small delay before allowing new uploads
    setTimeout(() => {
      setAttemptingRecovery(false);
      logDiagnostic('Upload system reset completed');
    }, 1000);
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
      
      {uploadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>{uploadError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryUploads}
              disabled={attemptingRecovery}
              className="ml-2"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${attemptingRecovery ? 'animate-spin' : ''}`} />
              Retry Uploads
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <RequiredPhotos
        isUploading={isUploading || attemptingRecovery}
        onFileSelect={handleFileUpload}
        progress={uploadProgress}
        diagnosticId={diagnosticId}
      />
      
      <UploadProgress 
        progress={hookProgress} 
        error={uploadError !== null}
        onRetry={handleRetryUploads}
      />
      
      <AdditionalPhotos
        isUploading={isUploading || attemptingRecovery}
        onFilesSelect={(files) => {
          logDiagnostic('Additional files selected', { count: files.length });
          files.forEach(async (file, index) => {
            await handleFileUpload(file, `additional_${index}`);
          });
        }}
        diagnosticId={diagnosticId}
      />
    </Card>
  );
};
