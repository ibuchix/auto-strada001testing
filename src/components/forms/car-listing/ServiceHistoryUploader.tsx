
/**
 * Service History Uploader Component
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently with database converters
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File, FileText } from "lucide-react";
import { useFormData } from "./context/FormDataContext";
import { ServiceHistoryFile } from "@/types/forms";

export const ServiceHistoryUploader = () => {
  const { form } = useFormData();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const uploadedFiles = form.watch('serviceHistoryFiles') || [];
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(50);
      
      const newFiles: ServiceHistoryFile[] = Array.from(e.target.files).map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadDate: new Date().toISOString()
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(80);
      
      // Update form with new files
      const currentFiles = form.getValues('serviceHistoryFiles') || [];
      form.setValue('serviceHistoryFiles', [...currentFiles, ...newFiles], { 
        shouldDirty: true,
        shouldValidate: true
      });
      
      setUploadProgress(100);
    } catch (error) {
      console.error("Error uploading service history files:", error);
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };
  
  const removeFile = (fileId: string) => {
    const currentFiles = form.getValues('serviceHistoryFiles') || [];
    const updatedFiles = currentFiles.filter(file => file.id !== fileId);
    form.setValue('serviceHistoryFiles', updatedFiles, { 
      shouldDirty: true,
      shouldValidate: true
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Service History Documents</h3>
          <p className="text-sm text-muted-foreground">Upload service booklets, invoices, or MOT certificates</p>
        </div>
        
        <input
          id="service-history-upload"
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="hidden"
          onChange={handleFileUpload}
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
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </span>
          </Button>
        </label>
      </div>
      
      {isUploading && (
        <div className="w-full">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-center mt-1 text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}
      
      {uploadedFiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center">
                {file.type?.includes('pdf') ? (
                  <FileText className="h-5 w-5 mr-2 text-red-500" />
                ) : (
                  <File className="h-5 w-5 mr-2 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(file.uploadedAt || file.uploadDate || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file.id)}
                className="h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-center text-muted-foreground py-2">
          No service history documents uploaded yet
        </p>
      )}
    </div>
  );
};
