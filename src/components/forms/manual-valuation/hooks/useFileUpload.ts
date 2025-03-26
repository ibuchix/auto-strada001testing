
/**
 * Hook for file upload functionality
 */
import { useState } from "react";
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
  
  const updateProgress = (newProgress: number) => {
    setProgress(newProgress);
    if (onProgressUpdate) onProgressUpdate(newProgress);
  };

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return;

    setIsUploading(true);
    updateProgress(0);

    try {
      // Create unique file path with type-based organization
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

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
  };

  const handleDocumentUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    updateProgress(0);
    
    try {
      const newDocuments = Array.from(files);
      
      const totalFiles = newDocuments.length;
      let completedFiles = 0;
      const uploadUrls: string[] = [];
      
      for (const file of newDocuments) {
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
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('car-images')
          .getPublicUrl(fileName);
          
        uploadUrls.push(publicUrl);
        
        // Update progress
        completedFiles++;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        updateProgress(newProgress);
      }
      
      // Update form
      const currentFiles = form.getValues('serviceHistoryFiles') || [];
      form.setValue('serviceHistoryFiles', [...currentFiles, ...uploadUrls], {
        shouldValidate: true,
        shouldDirty: true
      });
      
      toast.success(`${uploadUrls.length} document(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      updateProgress(0);
    }
  };
  
  const handleAdditionalPhotos = (files: File[]) => {
    files.forEach((file, index) => {
      handleFileUpload(file, `additional_${index}`);
    });
  };
  
  const removeUploadedFile = (url: string) => {
    const currentFiles = [...(form.getValues('serviceHistoryFiles') || [])];
    const updatedFiles = currentFiles.filter(fileUrl => fileUrl !== url);
    form.setValue('serviceHistoryFiles', updatedFiles, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  return {
    isUploading,
    progress,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  };
};
