
/**
 * ServiceHistorySection Component
 * Created: 2025-05-20
 * Updated: 2025-05-30 - Fixed removeDocument prop name to removeFile
 * Updated: 2025-05-31 - Fixed component props and imports
 */

import React from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData, ServiceHistoryFile } from "@/types/forms";
import { useDocumentUpload } from "./useDocumentUpload";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import { ServiceHistoryTypeSelector } from "./ServiceHistoryTypeSelector";

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
    removeFile,
  } = useDocumentUpload();

  const serviceHistoryType = form.watch('serviceHistoryType');
  const showDocumentUpload = serviceHistoryType && serviceHistoryType !== 'none';

  return (
    <div className="space-y-6">
      <div className="space-y-6 p-6 bg-accent/30 rounded-lg">
        <ServiceHistoryTypeSelector />

        {showDocumentUpload && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Service History Documents</h3>
            
            <DocumentUploader
              onUpload={uploadDocument}
              isUploading={isUploading}
              carId="mock-car-id"
            />
            
            <DocumentList
              uploadedFiles={serviceHistoryFiles}
              onRemoveUploaded={removeFile}
            />
          </div>
        )}
      </div>
    </div>
  );
};
