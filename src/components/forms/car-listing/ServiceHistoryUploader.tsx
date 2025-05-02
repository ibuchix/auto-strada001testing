
/**
 * Service History Document Uploader
 * Created: 2025-05-02
 * Updated: 2025-05-03 Fixed TypeScript errors with ServiceHistoryFile types
 * Updated: 2025-06-15 Fixed TypeScript type errors with string[] handling
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFormData } from "./context/FormDataContext";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";
import { FileText, X, Upload, FileCheck } from "lucide-react";
import { ServiceHistoryFile } from "@/types/forms";

export const ServiceHistoryUploader = () => {
  const { form } = useFormData();
  const [showUploader, setShowUploader] = useState(false);
  
  const { 
    files, 
    isUploading, 
    progress, 
    uploadFiles, 
    removeFile 
  } = useTemporaryFileUpload({
    category: 'service_history',
    allowMultiple: true,
    maxFiles: 10,
    onUploadComplete: (uploadedFiles) => {
      // After upload completes, update the form
      const serviceHistoryFiles = form.getValues('serviceHistoryFiles') || [];
      const fileIds = uploadedFiles.map(f => f.id);
      
      // Cast currentFiles to string[] to avoid type issues
      const currentFiles: string[] = Array.isArray(serviceHistoryFiles) 
        ? serviceHistoryFiles.map(f => typeof f === 'string' ? f : f.id)
        : [];
        
      form.setValue('serviceHistoryFiles', [...currentFiles, ...fileIds], { shouldDirty: true });
    }
  });
  
  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };
  
  const handleRemoveDocument = (fileId: string) => {
    // Remove file from temporary storage
    removeFile(fileId);
    
    // Update form value
    const serviceHistoryFiles = form.getValues('serviceHistoryFiles') || [];
    
    // Handle different types of serviceHistoryFiles
    let updatedFiles: string[];
    
    if (Array.isArray(serviceHistoryFiles)) {
      updatedFiles = serviceHistoryFiles
        .filter(item => {
          if (typeof item === 'string') {
            return item !== fileId;
          } else {
            return item.id !== fileId;
          }
        })
        .map(item => {
          if (typeof item === 'string') {
            return item;
          } else {
            return item.id;
          }
        });
    } else {
      updatedFiles = [];
    }
    
    form.setValue('serviceHistoryFiles', updatedFiles, { shouldDirty: true });
  };
  
  // Initialize serviceHistoryFiles if not already set
  if (!form.getValues('serviceHistoryFiles')) {
    form.setValue('serviceHistoryFiles', [] as string[], { shouldDirty: true });
  }
  
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Service History Documents
      </h2>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Upload documents showing service history, maintenance records, and other relevant documentation.
        </p>
        
        {files.length > 0 && (
          <div className="space-y-2 mb-4">
            <h3 className="font-medium text-gray-700">Uploaded Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm truncate max-w-[200px]">
                      {file.file.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          {showUploader ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <FileText className="h-10 w-10 text-gray-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Select service history documents
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPG, PNG files up to 10MB
                  </p>
                </div>
                <div>
                  <input 
                    type="file" 
                    id="service-history-upload" 
                    multiple 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden"
                    onChange={handleDocumentSelect}
                    disabled={isUploading}
                  />
                  <label htmlFor="service-history-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Select Files"}
                      </span>
                    </Button>
                  </label>
                </div>
                {isUploading && (
                  <div className="w-full">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUploader(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Service History Documents
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
