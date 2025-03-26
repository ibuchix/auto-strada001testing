
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of additional photos component
 * - 2024-03-19: Added file type validation and limits
 * - 2024-08-09: Enhanced UI and added drag-and-drop functionality
 * - 2025-05-07: Added diagnosticId for debugging
 */

import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";
import { useState } from 'react';
import { toast } from 'sonner';

interface AdditionalPhotosProps {
  isUploading: boolean;
  onFilesSelect: (files: File[]) => void;
  diagnosticId?: string; // Added diagnosticId
}

export const AdditionalPhotos = ({ isUploading, onFilesSelect, diagnosticId }: AdditionalPhotosProps) => {
  const [previewFiles, setPreviewFiles] = useState<{file: File, preview: string}[]>([]);
  
  // Log diagnostic information if applicable
  const logDiagnostic = (event: string, data: any = {}) => {
    if (diagnosticId) {
      console.log(`[${diagnosticId}] [AdditionalPhotos] ${event}:`, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB max
    disabled: isUploading,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const reasons = rejectedFiles.map(r => r.errors[0].message).join(', ');
        toast(reasons, {
          description: "Some files were rejected",
          position: "bottom-center"
        });
        logDiagnostic('Files rejected', { 
          rejectedCount: rejectedFiles.length,
          reasons
        });
      }
      
      if (acceptedFiles.length > 0) {
        logDiagnostic('Files accepted', { count: acceptedFiles.length });
        
        // Create previews
        const newPreviews = acceptedFiles.map(file => ({
          file,
          preview: URL.createObjectURL(file)
        }));
        setPreviewFiles(prev => [...prev, ...newPreviews]);
        
        // Pass to parent handler
        onFilesSelect(acceptedFiles);
      }
    }
  });
  
  const removeFile = (index: number) => {
    logDiagnostic('File removed', { index });
    const newFiles = [...previewFiles];
    URL.revokeObjectURL(newFiles[index].preview); // Clean up preview URL
    newFiles.splice(index, 1);
    setPreviewFiles(newFiles);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Additional Photos (Optional)</h3>
      <p className="text-sm text-subtitle mb-4">
        Upload up to 5 additional photos showing any features or special aspects of your vehicle
      </p>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports: JPG, PNG, WebP (Max 10MB each)
        </p>
        <Button 
          type="button"
          variant="outline"
          className="mt-4"
          disabled={isUploading}
        >
          Select Files
        </Button>
      </div>

      {previewFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Selected Files</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previewFiles.map((file, index) => (
              <div key={index} className="relative border rounded-md overflow-hidden">
                <img 
                  src={file.preview} 
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white"
                >
                  <X className="h-4 w-4 text-gray-700" />
                </button>
                <div className="text-xs truncate p-2 bg-gray-50 border-t">
                  {file.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
