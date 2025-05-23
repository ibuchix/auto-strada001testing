
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
 * - 2025-05-04: Fixed property access and alignment with useDocumentUpload hook
 * - 2025-05-04: Resolved property mismatches with useDocumentUpload hook
 * - 2025-05-24: Updated to use camelCase field names consistently
 * - 2025-05-29: Fixed TypeScript errors with hook properties
 * - 2025-05-31: Fixed removeDocument prop name to removeFile
 * - 2025-06-07: Fixed property naming consistency with useDocumentUpload hook 
 */

import { ServiceHistoryFile } from "@/types/forms";
import { ServiceHistoryTypeSelector } from "./service-history/ServiceHistoryTypeSelector";
import { DocumentUploader } from "./service-history/DocumentUploader";
import { DocumentList } from "./service-history/DocumentList";
import { useDocumentUpload } from "./service-history/useDocumentUpload";
import { useFormData } from "./context/FormDataContext";

interface ServiceHistorySectionProps {
  carId?: string;
}

export const ServiceHistorySection = ({ carId }: ServiceHistorySectionProps) => {
  const { form } = useFormData();
  
  const serviceHistoryType = form.watch('serviceHistoryType');
  
  const {
    serviceHistoryFiles,
    isUploading,
    handleFileChange,
    uploadDocument,
    removeFile,
  } = useDocumentUpload();

  // Show the document upload section only if service history type is not "none"
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
              carId={carId}
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
