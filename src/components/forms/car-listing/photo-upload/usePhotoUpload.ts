
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors
 * - 2024-03-26: Updated to use the correct Supabase storage method
 * - 2024-03-26: Added proper typing for dropzone integration
 * - 2024-08-09: Enhanced to use organized Supabase Storage with categorized structure
 * - 2024-08-17: Refactored into smaller files for better maintainability
 * - 2025-05-07: Added diagnosticId prop and exposed uploadFile and resetUploadState
 * - 2028-06-01: Enhanced with error tracking, retry functionality
 * - 2028-06-10: Removed diagnostic logging functionality
 * - 2025-05-23: Added database record verification and upload recovery
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadPhoto } from './services/photoStorageService';
import { recoverPhotoRecords, verifyPhotoDbRecord } from './services/photoDbService';
import { supabase } from '@/integrations/supabase/client';

export interface UsePhotoUploadProps {
  carId?: string;
  category?: string;
  onProgressUpdate?: (progress: number) => void;
  maxRetries?: number;
  automaticRecovery?: boolean;
}

export const usePhotoUpload = ({ 
  carId, 
  category = 'general', 
  onProgressUpdate,
  maxRetries = 2,
  automaticRecovery = true
}: UsePhotoUploadProps = {}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const retryCountRef = useRef<number>(0);
  const recoveryAttemptedRef = useRef<boolean>(false);

  // Log event information
  const logEvent = (event: string, data: any = {}) => {
    console.log(`[usePhotoUpload] ${event}:`, {
      ...data,
      timestamp: new Date().toISOString(),
      carId,
      category,
      retryCount: retryCountRef.current
    });
  };
  
  // Check for orphaned uploads on component mount
  useEffect(() => {
    if (carId && automaticRecovery && !recoveryAttemptedRef.current) {
      recoveryAttemptedRef.current = true;
      
      // Use immediate executor to run async code
      (async () => {
        try {
          logEvent('checkOrphanedUploads', { carId });
          const recoveredCount = await recoverPhotoRecords(carId);
          
          if (recoveredCount > 0) {
            toast.success(`Recovered ${recoveredCount} photo records`);
            logEvent('recoveredOrphanedUploads', { carId, recoveredCount });
          }
        } catch (error) {
          // No need to show an error to the user, just log it
          logEvent('recoveryError', { error });
        }
      })();
    }
  }, [carId, automaticRecovery]);

  const resetUploadState = useCallback(() => {
    logEvent('resetUploadState', { message: 'Reset upload state' });
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
    retryCountRef.current = 0;
    attemptIdRef.current = null;
    setCurrentFile(null);
  }, []);

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
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Generate a unique ID for this upload attempt
    attemptIdRef.current = `upload-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Simulate progress updates (actual progress comes from the server)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + 5, 90);
        setUploadProgress(progress);
        if (onProgressUpdate) onProgressUpdate(progress);
      }, 200);
      
      // Upload the file
      const result = await uploadPhoto(file, carId || 'temp', category);
      
      // Clear interval and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (onProgressUpdate) onProgressUpdate(100);
      
      logEvent('uploadFile-completed', { 
        message: 'File upload completed successfully',
        result 
      });
      
      // Reset retry counter on success
      retryCountRef.current = 0;
      
      // Update UI with the uploaded photo
      if (result) {
        setUploadedPhotos(prev => [...prev, result]);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to upload file";
      setUploadError(errorMessage);
      
      logEvent('uploadFile-error', { 
        message: 'File upload failed',
        error: errorMessage
      });
      
      // Handle retry logic via the caller, rather than here
      // This gives the caller more control over the retry flow
      
      toast.error(`Upload failed: ${errorMessage}`, {
        description: retryCountRef.current > 0 ? `Failed after ${retryCountRef.current + 1} attempts` : undefined,
      });
      
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle retry logic
  const retryUpload = useCallback(async (): Promise<string | null> => {
    if (!currentFile || !carId) return null;
    
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      
      logEvent('uploadFile-retry', { 
        message: `Manual retry attempt ${retryCountRef.current} of ${maxRetries}`,
        fileName: currentFile.name
      });
      
      toast.info(`Retrying upload... (Attempt ${retryCountRef.current} of ${maxRetries})`);
      
      try {
        return await uploadFile(currentFile, category);
      } catch (error) {
        // Error handling is already done in uploadFile
        return null;
      }
    } else {
      toast.error(`Maximum retry attempts (${maxRetries}) reached. Please try again later.`);
      return null;
    }
  }, [currentFile, carId, maxRetries, category, uploadFile]);
  
  // Verify database record exists for a file
  const verifyUploadRecord = useCallback(async (filePath: string): Promise<boolean> => {
    if (!carId || !filePath) return false;
    
    try {
      logEvent('verifyUploadRecord', { filePath });
      return await verifyPhotoDbRecord(filePath, carId);
    } catch (error) {
      logEvent('verifyUploadRecordError', { filePath, error });
      return false;
    }
  }, [carId]);

  return {
    uploadedPhotos,
    isUploading,
    uploadProgress,
    uploadError,
    currentFile,
    uploadFile,
    resetUploadState,
    retryUpload,
    retryCount: retryCountRef.current,
    maxRetries,
    verifyUploadRecord
  };
};
