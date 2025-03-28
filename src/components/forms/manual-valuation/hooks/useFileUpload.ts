
/**
 * Hook for file upload functionality
 * - 2024-08-27: Updated return type for handleFileUpload to be explicit about returning string | null
 * - 2024-09-01: Optimized file upload with better memory management and parallel processing
 */
import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface UseFileUploadProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const useFileUpload = ({ form, onProgressUpdate }: UseFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
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

    try {
      // Create unique file path with type-based organization
      const filePath = createStoragePath(file, type);

      // Upload to the car-images bucket with proper categorization
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      updateProgress(100);

      // Update form data with the uploaded file path
      const currentPhotos = form.getValues('uploadedPhotos') || [];
      form.setValue('uploadedPhotos', [...currentPhotos, publicUrl], {
        shouldValidate: true,
        shouldDirty: true
      });

      toast.success(`Photo uploaded successfully`);
      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [form, updateProgress, createStoragePath]);

  const handleDocumentUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    updateProgress(0);
    
    try {
      const newDocuments = Array.from(files);
      
      const totalFiles = newDocuments.length;
      let completedFiles = 0;
      const uploadUrls: string[] = [];
      
      // Process uploads in parallel batches of 3 for better performance
      const batchSize = 3;
      for (let i = 0; i < newDocuments.length; i += batchSize) {
        const batch = newDocuments.slice(i, i + batchSize);
        
        const uploadPromises = batch.map(async (file) => {
          // Create unique file path
          const fileExt = file.name.split('.').pop();
          const fileName = `valuation/service_documents/${uuidv4()}.${fileExt}`;
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('car-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) {
            console.error('Error uploading document:', uploadError);
            return null;
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('car-images')
            .getPublicUrl(fileName);
            
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
      console.error('Error uploading documents:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      updateProgress(0);
    }
  }, [form, updateProgress]);
  
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
