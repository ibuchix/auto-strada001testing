
/**
 * Hook for file upload functionality
 * - 2024-08-27: Updated return type for handleFileUpload to be explicit about returning string | null
 * - 2024-09-01: Optimized file upload with better memory management and parallel processing
 * - 2025-05-19: Refactored to use direct Supabase uploads instead of API routes
 * - 2025-05-20: Enhanced with direct upload methods and improved progress reporting
 */
import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { directUploadPhoto } from "@/services/supabase/uploadService";

interface UseFileUploadProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const useFileUpload = ({ form, onProgressUpdate }: UseFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  
  // Memoize update function to prevent recreations
  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    if (onProgressUpdate) onProgressUpdate(newProgress);
  }, [onProgressUpdate]);

  const handleFileUpload = useCallback(async (file: File, type: string): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    setUploadingFile(file.name);
    updateProgress(10);
    
    try {
      console.log(`[useFileUpload] Starting direct upload for ${file.name} (type: ${type})`);

      // Use direct upload method instead of API route
      updateProgress(30);
      const publicUrl = await directUploadPhoto(file, "temp", type);
      updateProgress(90);
      
      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      // Update form data with the uploaded file path
      const currentPhotos = form.getValues('uploadedPhotos') || [];
      form.setValue('uploadedPhotos', [...currentPhotos, publicUrl], {
        shouldValidate: true,
        shouldDirty: true
      });

      console.log(`[useFileUpload] Upload successful: ${publicUrl}`);
      updateProgress(100);
      
      // Success notification with toast
      toast.success(`Photo uploaded successfully`);
      return publicUrl;
    } catch (error: any) {
      console.error('[useFileUpload] Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
      setUploadingFile(null);
      // Reset progress after a short delay to show completion
      setTimeout(() => updateProgress(0), 1000);
    }
  }, [form, updateProgress]);

  const handleDocumentUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    updateProgress(0);
    
    try {
      const newDocuments = Array.from(files);
      const totalFiles = newDocuments.length;
      const uploadUrls: string[] = [];
      
      // Process uploads in batches of 3 for better performance
      const batchSize = 3;
      for (let i = 0; i < newDocuments.length; i += batchSize) {
        const batch = newDocuments.slice(i, i + batchSize);
        
        setUploadingFile(`Uploading ${i+1}-${Math.min(i+batch.length, totalFiles)} of ${totalFiles} files...`);
        
        const uploadPromises = batch.map(async (file) => {
          // Use direct upload for documents too
          return directUploadPhoto(file, "temp", "service_documents");
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(uploadPromises);
        
        // Filter out failed uploads and add successful ones
        batchResults.filter(Boolean).forEach(url => url && uploadUrls.push(url));
        
        // Update progress
        const completedFiles = i + batch.length;
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
      setUploadingFile(null);
      updateProgress(0);
    }
  }, [form, updateProgress]);
  
  const handleAdditionalPhotos = useCallback((files: File[]) => {
    // Process in parallel with Promise.all for better performance
    Promise.all(
      files.map((file, index) => handleFileUpload(file, `additional_${index}`))
    ).then(results => {
      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        toast.success(`${successCount} additional photos uploaded`);
      }
    });
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
    uploadingFile,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  }), [
    isUploading,
    progress,
    uploadingFile,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  ]);
};
