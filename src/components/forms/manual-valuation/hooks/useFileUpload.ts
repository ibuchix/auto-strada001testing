
/**
 * Hook for file upload functionality
 * - 2024-08-27: Updated return type for handleFileUpload to be explicit about returning string | null
 * - 2024-09-01: Optimized file upload with better memory management and parallel processing
 * - 2025-05-19: Refactored to use direct Supabase uploads instead of API routes
 */
import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { directUploadPhoto } from "@/services/supabase/uploadService";
import { useTempFileUploadManager } from "@/hooks/useTempFileUploadManager";

interface UseFileUploadProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const useFileUpload = ({ form, onProgressUpdate }: UseFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { 
    registerUpload, 
    registerCompletion, 
    registerFailure,
    getPendingCount 
  } = useTempFileUploadManager();
  
  // Memoize update function to prevent recreations
  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    if (onProgressUpdate) onProgressUpdate(newProgress);
  }, [onProgressUpdate]);

  // Generate storage paths only once per file
  const createStoragePath = useCallback((file: File, type: string): string => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    return `${type}/${fileName}`;
  }, []);

  const handleFileUpload = useCallback(async (file: File, type: string): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    updateProgress(0);
    
    // Register with the upload manager
    const uploadId = registerUpload(file);

    try {
      // Generate fake progress updates
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
          updateProgress(progress);
        } else {
          clearInterval(progressInterval);
        }
      }, 200);
      
      // Use direct upload method instead of API route
      console.log(`[useFileUpload] Starting direct upload for ${file.name}`);
      const publicUrl = await directUploadPhoto(file, "temp", type);
      
      clearInterval(progressInterval);
      updateProgress(100);
      
      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      // Update form data with the uploaded file path
      const currentPhotos = form.getValues('uploadedPhotos') || [];
      form.setValue('uploadedPhotos', [...currentPhotos, publicUrl], {
        shouldValidate: true,
        shouldDirty: true
      });
      
      // Mark as completed in the upload manager
      registerCompletion(uploadId);

      console.log(`[useFileUpload] Upload successful: ${publicUrl}`);
      toast.success(`Photo uploaded successfully`);
      return publicUrl;
    } catch (error: any) {
      console.error('[useFileUpload] Upload error:', error);
      
      // Mark as failed in the upload manager
      registerFailure(uploadId);
      
      toast.error(error.message || 'Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
      updateProgress(0);
    }
  }, [form, updateProgress, createStoragePath, registerUpload, registerCompletion, registerFailure]);

  const handleDocumentUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    updateProgress(0);
    
    try {
      const newDocuments = Array.from(files);
      
      const totalFiles = newDocuments.length;
      let completedFiles = 0;
      const uploadUrls: string[] = [];
      const uploadIds: string[] = [];
      
      // Register all files with upload manager
      newDocuments.forEach(file => {
        uploadIds.push(registerUpload(file));
      });
      
      // Process uploads in parallel batches of 3 for better performance
      const batchSize = 3;
      for (let i = 0; i < newDocuments.length; i += batchSize) {
        const batch = newDocuments.slice(i, i + batchSize);
        
        const uploadPromises = batch.map(async (file, batchIndex) => {
          // Get session for user ID
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;
          
          if (!userId) {
            console.error('[useFileUpload] No user session found');
            return null;
          }
          
          // Create unique file path
          const fileExt = file.name.split('.').pop();
          const fileName = `valuation/service_documents/${uuidv4()}.${fileExt}`;
          
          // Upload directly to storage
          const { error: uploadError } = await supabase.storage
            .from('car-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error('[useFileUpload] Error uploading document:', uploadError);
            registerFailure(uploadIds[i + batchIndex]);
            return null;
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('car-images')
            .getPublicUrl(fileName);
          
          // Mark completed in upload manager  
          registerCompletion(uploadIds[i + batchIndex]);
            
          return publicUrl;
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(uploadPromises);
        
        // Filter out failed uploads and add successful ones
        batchResults.filter(Boolean).forEach(url => url && uploadUrls.push(url));
        
        // Update progress
        completedFiles += batch.length;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        updateProgress(newProgress);
      }
      
      // Update form with all successful uploads
      if (uploadUrls.length > 0) {
        const currentFiles = form.getValues('serviceHistoryFiles') || [];
        form.setValue('serviceHistoryFiles', [...currentFiles, ...uploadUrls], {
          shouldValidate: true,
          shouldDirty: true
        });
        
        toast.success(`${uploadUrls.length} document(s) uploaded successfully`);
      }
    } catch (error: any) {
      console.error('[useFileUpload] Error uploading documents:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      updateProgress(0);
    }
  }, [form, updateProgress, registerUpload, registerCompletion, registerFailure]);
  
  const handleAdditionalPhotos = useCallback((files: File[]) => {
    // Process in parallel with Promise.all for better performance
    Promise.all(
      files.map((file, index) => handleFileUpload(file, `additional_${index}`))
    );
  }, [handleFileUpload]);
  
  const removeUploadedFile = useCallback((url: string) => {
    const currentFiles = [...(form.getValues('serviceHistoryFiles') || [])];
    const updatedFiles = currentFiles.filter(fileUrl => fileUrl !== url);
    form.setValue('serviceHistoryFiles', updatedFiles, {
      shouldValidate: true,
      shouldDirty: true
    });
    
    // Try to delete the file from storage if we can extract the path
    try {
      // Extract the path from the URL
      const pathMatch = url.match(/\/storage\/v1\/object\/public\/([^?]+)/);
      if (pathMatch && pathMatch[1]) {
        const path = pathMatch[1];
        supabase.storage
          .from('car-images')
          .remove([path])
          .catch(error => console.warn('Could not remove file from storage:', error));
      }
    } catch (error) {
      console.warn('Could not parse storage path from URL:', error);
    }
  }, [form]);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(() => ({
    isUploading,
    progress,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  }), [
    isUploading,
    progress,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  ]);
};
