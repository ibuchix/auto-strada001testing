
/**
 * Changes made:
 * - Created custom hook for Service History section
 * - Encapsulated document management and validation logic
 * - Implemented service history type handling
 */

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
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
      const uploadedUrls = validFiles.map((file, index) => ({
        id: `doc-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        uploadDate: new Date().toISOString()
      }));
      
      // Update form with new files
      const currentFiles = form.getValues('serviceHistoryFiles') || [];
      const newFiles = [...currentFiles, ...uploadedUrls];
      
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
    const updatedFiles = currentFiles.filter(file => file.id !== fileId);
    
    form.setValue('serviceHistoryFiles', updatedFiles, { shouldValidate: true });
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
