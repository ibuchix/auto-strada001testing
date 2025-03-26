
/**
 * Changes made:
 * - Fixed type issues
 * - Removed diagnostic-related code
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, AlertTriangle, RefreshCw } from "lucide-react";
import { UploadProgress } from "../UploadProgress";

export interface PhotoUploadProps {
  id: string;
  title?: string;
  description?: string;
  label?: string; // For backward compatibility
  isUploading: boolean;
  isRequired?: boolean;
  isUploaded?: boolean; // Made optional to fix type error
  disabled?: boolean;
  progress?: number;
  onFileSelect?: (file: File) => Promise<void>;
  onUpload?: (file: File) => Promise<string | null>;
}

export const PhotoUpload = ({
  id,
  title,
  description,
  label, // For backward compatibility
  isUploading: externalIsUploading,
  isRequired = false,
  isUploaded = false,
  disabled = false,
  progress,
  onFileSelect,
  onUpload
}: PhotoUploadProps) => {
  const [localUploadProgress, setLocalUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // For backward compatibility
  const displayTitle = title || label || 'Upload Photo';
  const displayDescription = description || 'Upload a clear photo';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset state
    setError(null);
    setLocalUploadProgress(0);
    setUploadedFile(file);

    try {
      // Use onUpload if provided, otherwise onFileSelect
      if (onUpload) {
        const result = await onUpload(file);
        
        // Reset file input
        if (result) {
          e.target.value = '';
        } else {
          throw new Error("Upload failed - no file path returned");
        }
      } else if (onFileSelect) {
        await onFileSelect(file);
        
        // Reset file input
        e.target.value = '';
      }
    } catch (error: any) {
      console.error(`Error uploading file "${id}":`, error);
      setError(error.message || "Failed to upload file");
    }
  };

  const handleProgressUpdate = (progress: number) => {
    setLocalUploadProgress(progress);
  };

  const handleRetry = () => {
    // Reset error state
    setError(null);
    setLocalUploadProgress(0);
    
    // Reuse the same file if available
    if (uploadedFile) {
      const file = uploadedFile;
      
      // Attempt the upload again
      if (onUpload) {
        onUpload(file)
          .catch(error => {
            console.error(`Error retrying upload "${id}":`, error);
            setError(error.message || "Failed to upload file");
          });
      } else if (onFileSelect) {
        onFileSelect(file)
          .catch(error => {
            console.error(`Error retrying upload "${id}":`, error);
            setError(error.message || "Failed to upload file");
          });
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <div className="mb-4">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium">
              {displayTitle}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {displayDescription}
            </p>
          </div>
          
          <div className="mt-4 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={externalIsUploading || disabled}
            >
              <label
                htmlFor={`file-upload-${id}`}
                className="flex items-center justify-center w-full cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span>Upload</span>
                <input
                  id={`file-upload-${id}`}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                  disabled={externalIsUploading || disabled}
                />
              </label>
            </Button>
          </div>
          
          <UploadProgress
            progress={localUploadProgress || progress || 0}
            error={!!error}
            onRetry={handleRetry}
          />
          
          {error && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
