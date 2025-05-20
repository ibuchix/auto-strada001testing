
/**
 * ServiceHistoryUploader Component
 * Updated: 2025-06-19 - Fixed UseTemporaryFileUploadOptions property
 * Updated: 2025-06-20 - Removed invalid allowedTypes property and fixed type compatibility
 * Updated: 2025-06-21 - Fixed type compatibility with TemporaryFileUpload options
 * Updated: 2025-07-24 - Fixed ServiceHistoryFile type compatibility
 * Updated: 2025-05-22 - Updated field names to use snake_case to match database schema
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";
import { useFormData } from "./context/FormDataContext";
import { ServiceHistoryFile } from "@/types/forms";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const ServiceHistoryUploader = () => {
  const { form } = useFormData();
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Create file uploader for service history documents without invalid properties
  const fileUploader = useTemporaryFileUpload({
    category: 'service_history',
    allowMultiple: true,
    maxFiles: 5
  });
  
  // Update form data when files change
  useEffect(() => {
    // Convert TemporaryFile[] to ServiceHistoryFile[]
    const serviceHistoryFiles: ServiceHistoryFile[] = fileUploader.files.map(file => ({
      id: file.id,
      name: file.file.name,
      url: file.url,
      type: file.file.type,
      uploadedAt: new Date().toISOString(),
      uploadDate: new Date().toISOString() // Include both for compatibility
    }));
    
    form.setValue("service_history_files", serviceHistoryFiles, { shouldDirty: true });
  }, [fileUploader.files, form]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Service History Documents</h3>
      <p className="text-sm text-muted-foreground">
        Upload any service history documents you have for the vehicle.
      </p>
      
      {uploadError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      <div className="border rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Uploaded Documents</h4>
          <input 
            type="file" 
            id="service-history-upload" 
            multiple 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                fileUploader.uploadFiles(e.target.files)
                  .catch(error => setUploadError(error.message || "Failed to upload files"));
              }
            }}
          />
          <label htmlFor="service-history-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fileUploader.isUploading || fileUploader.files.length >= 5}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </span>
            </Button>
          </label>
        </div>
        
        {fileUploader.isUploading && (
          <div className="w-full">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${fileUploader.progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {fileUploader.files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fileUploader.files.map((file) => (
              <div key={file.id} className="relative group">
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 text-sm font-medium truncate">{file.file.name}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => fileUploader.removeFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
