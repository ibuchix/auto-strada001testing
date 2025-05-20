
/**
 * Document Upload Hook
 * Created: 2025-05-20
 * Updated: 2025-05-28 - Updated to use camelCase field names consistently
 */

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { CarListingFormData, ServiceHistoryFile } from "@/types/forms";
import { useToast } from "@/components/ui/use-toast";
import { getFieldValue, setFieldValue } from "@/utils/formHelpers";

export function useDocumentUpload() {
  const form = useFormContext<CarListingFormData>();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  // Get current service history files from the form
  const serviceHistoryFiles = getFieldValue<ServiceHistoryFile[]>(form, 'serviceHistoryFiles') || [];
  
  // Upload a new document
  const uploadDocument = async (file: File): Promise<void> => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // In a real app, this would be an actual upload to a file storage service
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new file entry
      const newFile: ServiceHistoryFile = {
        id: uuidv4(),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };
      
      // Add the new file to the existing files
      const updatedFiles = [...serviceHistoryFiles, newFile];
      
      // Update the form field
      setFieldValue(form, 'serviceHistoryFiles', updatedFiles, { shouldDirty: true });
      
      toast({
        title: "File uploaded",
        description: `${file.name} was successfully uploaded.`,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file input change event
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    uploadDocument(files[0]);
    
    // Clear the input value to allow selecting the same file again
    e.target.value = '';
  };
  
  // Remove a document
  const removeDocument = (id: string) => {
    const updatedFiles = serviceHistoryFiles.filter(file => file.id !== id);
    setFieldValue(form, 'serviceHistoryFiles', updatedFiles, { shouldDirty: true });
    
    toast({
      title: "File removed",
      description: "The document was removed from your service history.",
    });
  };
  
  // Effect to update the count of service history files in another field
  useEffect(() => {
    const fileCount = serviceHistoryFiles.length;
    form.setValue('serviceHistoryCount', fileCount);
  }, [serviceHistoryFiles, form]);
  
  return {
    serviceHistoryFiles,
    isUploading,
    handleFileChange,
    uploadDocument,
    removeDocument,
  };
}
