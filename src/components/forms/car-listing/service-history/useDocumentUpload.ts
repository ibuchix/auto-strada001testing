
/**
 * Hook to handle document upload functionality
 * - Optimized with memoization and parallel processing
 */
import { useState, useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'image/jpeg', 
  'image/png', 
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const useDocumentUpload = (form: UseFormReturn<CarListingFormData>, carId?: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);

  // Reset success indicator after 3 seconds
  useState(() => {
    if (uploadSuccess !== null) {
      const timer = setTimeout(() => setUploadSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  });

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload PDF, Word, or image files only"
      });
      return false;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "Maximum file size is 10MB"
      });
      return false;
    }
    
    return true;
  }, []);

  // Optimize file path creation
  const createFilePath = useCallback((file: File, carId: string): string => {
    const fileExt = file.name.split('.').pop();
    return `${carId}/service_documents/${uuidv4()}.${fileExt}`;
  }, []);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!carId) {
      toast.error("Car ID is required to upload documents");
      return;
    }

    // Filter valid files
    const validFiles = Array.from(files).filter(validateFile);
    if (validFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const newFilesArray = validFiles;
      setSelectedFiles(prev => [...prev, ...newFilesArray]);
      
      const totalFiles = newFilesArray.length;
      let completedFiles = 0;
      const uploadUrls: string[] = [];
      const uploadTasks: Promise<string | null>[] = [];
      
      // Process files in parallel batches for better performance
      const batchSize = 3; // Upload 3 files at a time
      
      for (let i = 0; i < newFilesArray.length; i += batchSize) {
        const batch = newFilesArray.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (file): Promise<string | null> => {
          try {
            // Create a unique file path in the service_documents folder
            const filePath = createFilePath(file, carId);
            
            // Upload the file to Supabase Storage
            const { error } = await supabase.storage
              .from('car-images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
              });
              
            if (error) {
              console.error('Error uploading document:', error);
              toast.error(`Failed to upload ${file.name}`);
              return null;
            }
            
            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
              .from('car-images')
              .getPublicUrl(filePath);
            
            // Track document in database
            await supabase
              .from('car_file_uploads')
              .insert({
                car_id: carId,
                file_path: filePath,
                file_type: file.type,
                upload_status: 'completed',
                category: 'service_document'
              });
            
            return publicUrl;
          } catch (err) {
            console.error('Error processing file:', err);
            return null;
          }
        });
        
        // Wait for the current batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Add successful uploads to the URL list
        batchResults.filter(Boolean).forEach(url => {
          if (url) uploadUrls.push(url);
        });
        
        // Update progress
        completedFiles += batch.length;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        setUploadProgress(newProgress);
      }
      
      // Update form with uploaded files
      if (uploadUrls.length > 0) {
        const currentFiles = form.getValues('serviceHistoryFiles') || [];
        form.setValue('serviceHistoryFiles', [...currentFiles, ...uploadUrls], { 
          shouldValidate: true, 
          shouldDirty: true 
        });
        
        // Show success message with count of uploaded files
        setUploadSuccess(uploadUrls.length);
        toast.success(`${uploadUrls.length} document${uploadUrls.length > 1 ? 's' : ''} uploaded successfully`, {
          description: "Your service history documents have been added to your listing"
        });
      }
      
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast.error(error.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [carId, form, validateFile, createFilePath]);

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prevFiles => {
      const filesArray = [...prevFiles];
      filesArray.splice(index, 1);
      return filesArray;
    });
  }, []);

  const removeUploadedFile = useCallback((url: string) => {
    const currentFiles = [...(form.getValues('serviceHistoryFiles') || [])];
    const updatedFiles = currentFiles.filter(fileUrl => fileUrl !== url);
    form.setValue('serviceHistoryFiles', updatedFiles, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
    toast.info("Document removed");
  }, [form]);

  // Return memoized object to prevent unnecessary rerenders
  return useMemo(() => ({
    isUploading,
    uploadProgress,
    selectedFiles,
    uploadSuccess,
    handleFileUpload,
    removeSelectedFile,
    removeUploadedFile
  }), [
    isUploading,
    uploadProgress,
    selectedFiles,
    uploadSuccess,
    handleFileUpload,
    removeSelectedFile,
    removeUploadedFile
  ]);
};
