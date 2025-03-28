
/**
 * Changes made:
 * - Created custom hook for Service History section
 * - Encapsulated document management and validation logic
 * - Implemented service history type handling
 * - 2025-11-05: Fixed TypeScript errors with service history files typing
 */

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData, ServiceHistoryFile } from "@/types/forms";
import { toast } from "sonner";

export const useServiceHistorySection = (form: UseFormReturn<CarListingFormData>, carId?: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const serviceHistoryType = form.watch('serviceHistoryType');
  const uploadedFiles = form.watch('serviceHistoryFiles') || [];
  
  // Handle document upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    if (!carId) {
      toast.error('Please save your listing first before uploading documents');
      return;
    }
    
    // Convert FileList to Array if needed
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFiles(fileArray);
    
    try {
      // Validate files
      const validFiles = fileArray.filter(file => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const isSizeValid = file.size <= 5 * 1024 * 1024; // 5MB max
        
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported file type`);
          return false;
        }
        
        if (!isSizeValid) {
          toast.error(`${file.name} exceeds the 5MB size limit`);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length === 0) {
        toast.error('No valid files to upload');
        return;
      }
      
      // Simulate upload with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(i);
      }
      
      // Generate mock URLs for uploaded files
      const uploadedUrls: ServiceHistoryFile[] = validFiles.map((file, index) => ({
        id: `doc-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        uploadDate: new Date().toISOString()
      }));
      
      // Update form with new files
      const currentFiles = form.getValues('serviceHistoryFiles') || [];
      // Cast to any to allow for flexibility in the types during transition
      const newFiles = [...currentFiles, ...uploadedUrls] as any;
      
      form.setValue('serviceHistoryFiles', newFiles, { shouldValidate: true });
      
      toast.success(`${validFiles.length} document(s) uploaded successfully`);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [carId, form]);
  
  // Remove a selected file (before upload)
  const removeSelectedFile = useCallback((index: number) => {
    if (index >= 0 && index < selectedFiles.length) {
      const newFiles = [...selectedFiles];
      newFiles.splice(index, 1);
      setSelectedFiles(newFiles);
    }
  }, [selectedFiles]);
  
  // Remove an uploaded file
  const removeUploadedFile = useCallback((fileId: string) => {
    const currentFiles = form.getValues('serviceHistoryFiles') || [];
    
    // Handle both string arrays and ServiceHistoryFile arrays
    const updatedFiles = currentFiles.filter((file: string | ServiceHistoryFile) => {
      if (typeof file === 'string') {
        return file !== fileId; // If file is a string, compare directly with fileId
      } else {
        return file.id !== fileId; // If file is an object, compare its id with fileId
      }
    });
    
    form.setValue('serviceHistoryFiles', updatedFiles as any, { shouldValidate: true });
    toast.success('Document removed');
  }, [form]);
  
  // Validate service history section
  const validateServiceHistorySection = useCallback(() => {
    if (!serviceHistoryType) {
      form.setError('serviceHistoryType', {
        type: 'required',
        message: 'Please select a service history type'
      });
      toast.error('Please select a service history type');
      return false;
    }
    
    // If type is "full" or "partial", documents should be uploaded
    if ((serviceHistoryType === 'full' || serviceHistoryType === 'partial') && uploadedFiles.length === 0) {
      toast.error('Please upload at least one service history document');
      return false;
    }
    
    return true;
  }, [serviceHistoryType, uploadedFiles.length, form]);
  
  return {
    isUploading,
    uploadProgress,
    selectedFiles,
    serviceHistoryType,
    uploadedFiles,
    handleFileUpload,
    removeSelectedFile,
    removeUploadedFile,
    validateServiceHistorySection
  };
};
