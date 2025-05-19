
/**
 * File Upload Hook
 * Created: 2025-05-24
 * 
 * Centralizes file upload logic with type-safe handling of File and FileList objects
 */

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface UseFileUploadProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const useFileUpload = ({ form, onProgressUpdate }: UseFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  
  // Handle file upload with unified File type
  const handleFileUpload = async (file: File, type: string): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setIsUploading(true);
      setUploadingFile(file.name);
      
      // Simulate progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress > 90) clearInterval(interval);
        
        setProgress(currentProgress);
        if (onProgressUpdate) onProgressUpdate(currentProgress);
      }, 300);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Complete the upload
      clearInterval(interval);
      setProgress(100);
      if (onProgressUpdate) onProgressUpdate(100);
      
      // Update form
      const photos = form.getValues(`${type}Photos`) || [];
      form.setValue(`${type}Photos`, [...photos, file.name], { 
        shouldValidate: true,
        shouldDirty: true 
      });
      
      return file.name;
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      // Reset after a short delay to show 100% completion
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        setUploadingFile(null);
      }, 500);
    }
  };
  
  // Handle document upload - accepts File or FileList and converts as needed
  const handleDocumentUpload = async (files: File | FileList): Promise<string | null> => {
    try {
      // If it's a FileList, take the first file
      let file: File;
      if (files instanceof FileList && files.length > 0) {
        file = files[0];
      } 
      // If it's already a File, use it directly
      else if (files instanceof File) {
        file = files;
      }
      // If neither, return early
      else {
        console.warn('Invalid file input:', files);
        return null;
      }
      
      const result = await handleFileUpload(file, 'serviceHistory');
      
      // Update form with service history files
      if (result) {
        const currentFiles = form.getValues('serviceHistoryFiles') || [];
        form.setValue('serviceHistoryFiles', [
          ...currentFiles, 
          { name: file.name, url: result }
        ], { 
          shouldValidate: true,
          shouldDirty: true 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Failed to upload document');
      return null;
    }
  };
  
  // Handle additional photos - accepts File[] or FileList
  const handleAdditionalPhotos = async (files: File[] | FileList): Promise<string[]> => {
    const results: string[] = [];
    
    try {
      // Convert FileList to array if needed
      const fileArray = files instanceof FileList ? Array.from(files) : files;
      
      // Process each file
      for (const file of fileArray) {
        setUploadingFile(file.name);
        const result = await handleFileUpload(file, 'additional');
        if (result) results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Additional photos upload error:', error);
      toast.error('Failed to upload additional photos');
      return results;
    }
  };
  
  // Remove previously uploaded file
  const removeUploadedFile = (fileUrl: string) => {
    const currentFiles = form.getValues('serviceHistoryFiles') || [];
    const updatedFiles = currentFiles.filter(file => file.url !== fileUrl);
    
    form.setValue('serviceHistoryFiles', updatedFiles, {
      shouldValidate: true,
      shouldDirty: true
    });
  };
  
  return {
    isUploading,
    progress,
    uploadingFile,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  };
};
