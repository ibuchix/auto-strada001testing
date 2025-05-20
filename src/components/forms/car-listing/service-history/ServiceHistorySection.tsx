
/**
 * ServiceHistorySection Component
 * Created: 2025-05-20
 * Updated: 2025-05-30 - Fixed removeDocument prop name to removeFile
 */

import React from "react";
import { FormFieldset } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { CarListingFormData, ServiceHistoryFile } from "@/types/forms";
import { useDocumentUpload } from "./useDocumentUpload";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import { ServiceHistoryTypeSelector } from "./ServiceHistoryTypeSelector";
import { Typography } from "@/components/ui/typography";

export const ServiceHistorySection: React.FC = () => {
  const form = useFormContext<CarListingFormData>();
  const {
    serviceHistoryFiles,
    isUploading,
    error,
    uploadProgress,
    uploadSuccess,
    selectedFiles,
    handleFileChange,
    handleFileUpload,
    uploadDocument,
    removeSelectedFile,
    removeFile, // This is the correct prop name
  } = useDocumentUpload();

  return (
    <FormFieldset
      title="Service History"
      description="Add any service history information for the vehicle"
    >
      <div className="space-y-6">
        <ServiceHistoryTypeSelector />
        
        <div className="space-y-4">
          <Typography variant="h4">Upload Service History Documents</Typography>
          
          <DocumentUploader
            onFileChange={handleFileChange}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadSuccess={uploadSuccess}
            error={error}
          />
          
          <DocumentList
            documents={serviceHistoryFiles}
            onRemove={removeFile} // Use the correct prop name here
          />
        </div>
      </div>
    </FormFieldset>
  );
};
