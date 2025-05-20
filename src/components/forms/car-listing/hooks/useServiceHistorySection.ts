
/**
 * Service History Section Hook
 * Updated: 2025-07-24 - Fixed ServiceHistoryFile type compatibility
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 */

import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData, ServiceHistoryFile } from "@/types/forms";

export const useServiceHistorySection = () => {
  const { register, watch, setValue } = useFormContext<CarListingFormData>();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Watch for changes to the has_service_history field
  const has_service_history = watch("has_service_history");
  const service_history_type = watch("service_history_type");
  const service_history_files = watch("service_history_files") || [];
  
  // Handle service history type change
  const handleTypeChange = (value: string) => {
    setValue("service_history_type", value as "full" | "partial" | "none", { shouldDirty: true });
  };
  
  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const newFiles: ServiceHistoryFile[] = [];
      
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Generate a unique ID for the file
        const fileId = `service-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Create a URL for the file (in a real app this would be an upload to server)
        const fileUrl = URL.createObjectURL(file);
        
        // Add the file to our array
        newFiles.push({
          id: fileId,
          name: file.name,
          url: fileUrl,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          uploadDate: new Date().toISOString() // Include both for compatibility
        });
      }
      
      // Update the form with the new files
      const updatedFiles = [...service_history_files, ...newFiles];
      setValue("service_history_files", updatedFiles, { shouldDirty: true });
      
    } catch (error) {
      console.error("Error uploading service history files:", error);
      setUploadError("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [service_history_files, setValue]);
  
  // Remove a file from the list
  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = service_history_files.filter(file => file.id !== fileId);
    setValue("service_history_files", updatedFiles, { shouldDirty: true });
  }, [service_history_files, setValue]);
  
  return {
    has_service_history,
    service_history_type,
    service_history_files,
    isUploading,
    uploadError,
    handleTypeChange,
    handleFileUpload,
    removeFile,
    register
  };
};
