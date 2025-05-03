
/**
 * Changes made:
 * - 2024-08-15: Added Supabase Storage integration for service document uploads
 * - 2024-08-15: Implemented document preview and file listing
 * - 2024-08-16: Fixed File constructor usage for document preview
 * - 2027-08-04: Added improved file type validation and upload feedback
 * - 2027-08-04: Enhanced upload success feedback with toast notifications
 * - 2027-08-04: Added conditional rendering for document upload based on service history type
 * - 2027-08-16: Refactored into smaller components for better maintainability
 * - 2025-11-05: Updated to use ServiceHistoryFile type for proper typing
 * - 2025-04-03: Updated to use FormDataContext instead of requiring form prop
 * - 2025-05-03: Fixed TypeScript errors related to useDocumentUpload hook properties
 */

import { CarListingFormData, ServiceHistoryFile } from "@/types/forms";
import { ServiceHistoryTypeSelector } from "./service-history/ServiceHistoryTypeSelector";
import { DocumentUploader } from "./service-history/DocumentUploader";
import { DocumentList } from "./service-history/DocumentList";
import { useDocumentUpload } from "./service-history/useDocumentUpload";
import { useFormData } from "./context/FormDataContext";
import { useState } from "react";

interface ServiceHistorySectionProps {
  carId?: string;
}

export const ServiceHistorySection = ({ carId }: ServiceHistorySectionProps) => {
  const { form } = useFormData();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<number | null>(null);
  
  const serviceHistoryType = form.watch('serviceHistoryType');
  const uploadedFiles = form.watch('serviceHistoryFiles') || [];
  
  const {
    files,
    uploading,
    error,
    uploadFile,
    removeFile,
  } = useDocumentUpload();

  // Event handlers for file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    setUploadProgress(0);
    
    // Upload each file
    const uploadPromises = fileArray.map(file => {
      return uploadFile(file);
    });
    
    // Set progress during upload
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress <= 90) {
        setUploadProgress(progress);
      }
    }, 100);
    
    try {
      await Promise.all(uploadPromises);
      clearInterval(interval);
      setUploadProgress(100);
      setUploadSuccess(fileArray.length);
      
      // Clear selected files after successful upload
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadSuccess(null);
      }, 3000);
      
    } catch (e) {
      clearInterval(interval);
      setUploadProgress(0);
    }
  };
  
  const removeSelectedFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };
  
  const removeUploadedFile = (id: string) => {
    removeFile(id);
  };

  // Show the document upload section only if service history type is not "none"
  const showDocumentUpload = serviceHistoryType && serviceHistoryType !== 'none';

  return (
    <div className="space-y-6">
      <div className="space-y-6 p-6 bg-accent/30 rounded-lg">
        <ServiceHistoryTypeSelector form={form} />

        {showDocumentUpload && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Service History Documents</h3>
            
            <DocumentUploader
              onUpload={handleFileUpload}
              isUploading={uploading}
              uploadSuccess={uploadSuccess}
              uploadProgress={uploadProgress}
              carId={carId}
            />
            
            <DocumentList
              selectedFiles={selectedFiles}
              uploadedFiles={uploadedFiles}
              onRemoveSelected={removeSelectedFile}
              onRemoveUploaded={removeUploadedFile}
            />
          </div>
        )}
      </div>
    </div>
  );
};
