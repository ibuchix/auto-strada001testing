
/**
 * Changes made:
 * - Refactored from a large single file into smaller, more focused hooks
 * - Simplified main hook to compose functionality from utility hooks
 * - Improved separation of concerns for better maintainability
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useUploadState } from './useUploadState';
import { useUploadProgress } from './useUploadProgress';
import { useRetryLogic } from './useRetryLogic';
import { uploadPhoto } from '../services/photoStorageService';
import { logUploadAttempt, updateUploadAttempt } from '../services/uploadDiagnostics';

export interface UsePhotoUploadProps {
  carId?: string;
  category?: string;
  onProgressUpdate?: (progress: number) => void;
  maxRetries?: number;
}

export const usePhotoUpload = ({ 
  carId, 
  category = 'general', 
  onProgressUpdate,
  maxRetries = 2
}: UsePhotoUploadProps = {}) => {
  // Use more focused hooks for specific functionality
  const {
    uploadedPhotos,
    setUploadedPhotos,
    isUploading,
    setIsUploading,
    uploadError,
    setUploadError,
    currentFile,
    setCurrentFile
  } = useUploadState();
  
  const { uploadProgress, setUploadProgress } = useUploadProgress(onProgressUpdate);
  
  const {
    attemptIdRef,
    retryCountRef,
    resetRetryState,
    incrementRetryCount,
    logEvent,
    resetUploadState: resetRetryUploadState
  } = useRetryLogic(maxRetries);
  
  // Combined reset function that calls both reset functions
  const resetUploadState = () => {
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
    setCurrentFile(null);
    resetRetryUploadState();
  };

  const uploadFile = async (file: File, uploadPath: string): Promise<string | null> => {
    if (!file) {
      logEvent('uploadFile-error', { 
        message: 'Attempted to upload null file',
        uploadPath 
      });
      return null;
    }

    // Store the current file for potential retries
    setCurrentFile(file);
    setUploadError(null);
    
    logEvent('uploadFile-started', { 
      message: 'Starting file upload',
      fileName: file.name, 
      fileSize: file.size, 
      uploadPath 
    });
    
    // Log the upload attempt
    attemptIdRef.current = logUploadAttempt({
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
      success: false,
      uploadPath
    });
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload the file and get the URL
      const result = await uploadPhoto(file, carId || 'temp', category);
      
      // Update progress
      setUploadProgress(100);
      if (onProgressUpdate) {
        onProgressUpdate(100);
      }
      
      // Update upload tracking
      if (attemptIdRef.current) {
        updateUploadAttempt(attemptIdRef.current, {
          success: true,
          responseData: { filePath: result }
        });
      }
      
      logEvent('uploadFile-completed', { 
        message: 'File upload completed successfully',
        result 
      });
      
      // Reset retry counter on success
      resetRetryState();
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to upload file";
      setUploadError(errorMessage);
      
      // Update upload tracking
      if (attemptIdRef.current) {
        updateUploadAttempt(attemptIdRef.current, {
          success: false,
          error: errorMessage
        });
      }
      
      logEvent('uploadFile-error', { 
        message: 'File upload failed',
        error: errorMessage
      });
      
      // Handle retry logic
      if (retryCountRef.current < maxRetries) {
        incrementRetryCount();
        
        logEvent('uploadFile-retry', { 
          message: `Automatic retry attempt ${retryCountRef.current} of ${maxRetries}`,
          fileName: file.name
        });
        
        toast.error(`Upload failed: ${errorMessage}`, {
          description: `Retrying... (Attempt ${retryCountRef.current} of ${maxRetries})`,
          duration: 3000
        });
        
        // Retry after a short delay
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await uploadFile(file, uploadPath);
            resolve(result);
          }, 1000);
        });
      }
      
      toast.error(errorMessage, {
        description: "Failed to upload file after multiple attempts",
        action: {
          label: "Retry",
          onClick: () => {
            resetRetryState();
            uploadFile(file, uploadPath);
          }
        }
      });
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const retryUpload = async () => {
    if (!currentFile) {
      logEvent('retryUpload-error', { message: 'No file available to retry' });
      return null;
    }
    
    resetRetryState();
    logEvent('retryUpload-manual', { 
      message: 'Manual retry initiated',
      fileName: currentFile.name
    });
    
    return uploadFile(currentFile, carId || 'temp');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!carId) {
      toast.error("Car ID is required to upload photos.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = acceptedFiles.length;
      let completedFiles = 0;
      
      logEvent('onDrop-start', { 
        message: `Starting batch upload of ${totalFiles} files`,
        totalFiles
      });
      
      const uploadPromises = acceptedFiles.map(async (file) => {
        const result = await uploadFile(file, carId);
        
        // Update progress
        completedFiles++;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        setUploadProgress(newProgress);
        if (onProgressUpdate) {
          onProgressUpdate(newProgress);
        }
        
        return result;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(Boolean) as string[];
      
      setUploadedPhotos(prevPhotos => [...prevPhotos, ...successfulUploads]);
      
      logEvent('onDrop-complete', { 
        message: `Batch upload completed: ${successfulUploads.length} of ${totalFiles} files successful`,
        totalFiles,
        successfulCount: successfulUploads.length
      });
      
      toast.success(`${successfulUploads.length} of ${totalFiles} photos uploaded successfully!`);
    } catch (error: any) {
      logEvent('onDrop-error', { 
        message: 'Batch upload encountered an error',
        error: error.message 
      });
      
      console.error("Error uploading photos:", error);
      toast.error(error.message || "Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  }, [carId, category, uploadFile, setIsUploading, setUploadProgress, setUploadedPhotos, onProgressUpdate, logEvent]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp']
    },
    maxFiles: 10,
    disabled: isUploading
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isUploading,
    uploadProgress,
    uploadedPhotos,
    setUploadedPhotos,
    uploadFile,
    resetUploadState,
    retryUpload,
    uploadError
  };
};
