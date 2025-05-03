
/**
 * useDocumentUpload hook
 * Updated: 2025-07-27 - Fixed ServiceHistoryFile type issues
 * Updated: 2025-05-03 - Added missing properties to match component usage
 * Updated: 2025-05-04 - Fixed hook return type to include all necessary properties
 * Updated: 2025-05-04 - Fixed removeUploadedFile and other missing properties
 */

import { useState, useCallback, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { CarListingFormData, ServiceHistoryFile } from '@/types/forms';
import { tempFileStorageService } from '@/services/supabase/tempFileStorageService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export function useDocumentUpload() {
  const { setValue, watch } = useFormContext<CarListingFormData>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<ServiceHistoryFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Get current files from form
  const serviceHistoryFiles = watch('serviceHistoryFiles') || [];
  
  // Sync files with form data
  useEffect(() => {
    if (serviceHistoryFiles && serviceHistoryFiles.length > 0) {
      setFiles(serviceHistoryFiles);
    }
  }, [serviceHistoryFiles]);
  
  /**
   * Handle file upload
   */
  const uploadFile = useCallback(async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      
      // Check file type
      const acceptedTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!acceptedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, Word or image files only.');
      }
      
      // Upload file
      const result = await tempFileStorageService.addFile(file);
      
      // Create file record
      const newFile: ServiceHistoryFile = {
        id: uuidv4(),
        name: file.name,
        url: typeof result === 'string' ? result : result.url,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadDate: new Date().toISOString() // Add this for backwards compatibility
      };
      
      // Update local state
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      
      // Update form data
      setValue('serviceHistoryFiles', updatedFiles, { shouldDirty: true });
      
      toast.success('File uploaded successfully');
      return newFile;
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload file. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [files, setValue]);
  
  /**
   * Remove a file
   */
  const removeFile = useCallback((id: string) => {
    // Find file to delete
    const fileToDelete = files.find(file => file.id === id);
    if (!fileToDelete) return;
    
    // Remove file from storage
    const fileName = fileToDelete.name;
    tempFileStorageService.removeFileByName(fileName);
    
    // Update local state
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    
    // Update form data
    setValue('serviceHistoryFiles', updatedFiles, { shouldDirty: true });
    
    toast.success('File removed');
  }, [files, setValue]);
  
  /**
   * Add file that's already uploaded (from API response)
   */
  const addExistingFile = useCallback((fileData: Partial<ServiceHistoryFile>) => {
    // Create complete file record with required fields
    const newFile: ServiceHistoryFile = {
      id: fileData.id || uuidv4(),
      name: fileData.name || 'Document',
      url: fileData.url || '',
      type: fileData.type || 'application/pdf',
      uploadedAt: fileData.uploadedAt || new Date().toISOString(),
      uploadDate: fileData.uploadDate || new Date().toISOString() // For backwards compatibility
    };
    
    // Update local state
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    
    // Update form data
    setValue('serviceHistoryFiles', updatedFiles, { shouldDirty: true });
  }, [files, setValue]);

  /**
   * Handle file selection
   */
  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    const newSelectedFiles = Array.from(fileList);
    setSelectedFiles(newSelectedFiles);
    setUploadProgress(0);
    
    let progress = 10;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        setUploadProgress(progress);
      }
    }, 200);
    
    try {
      const uploadPromises = newSelectedFiles.map(file => uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      clearInterval(interval);
      setUploadProgress(100);
      setUploadSuccess(uploadedFiles.filter(Boolean).length);
      
      setTimeout(() => {
        setUploadSuccess(null);
        setSelectedFiles([]);
      }, 2000);
      
    } catch (err) {
      clearInterval(interval);
      console.error("Error uploading files:", err);
    } finally {
      setUploading(false);
    }
  }, [uploadFile]);
  
  /**
   * Remove a selected file
   */
  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);
  
  /**
   * Remove an uploaded file - alias for removeFile for compatibility
   */
  const removeUploadedFile = useCallback((id: string) => {
    removeFile(id);
  }, [removeFile]);
  
  return {
    files,
    uploading,
    error,
    uploadFile,
    removeFile,
    addExistingFile,
    uploadProgress,
    uploadSuccess,
    selectedFiles,
    handleFileUpload,
    removeSelectedFile,
    removeUploadedFile,
    isUploading: uploading
  };
}
