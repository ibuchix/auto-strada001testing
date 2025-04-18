
/**
 * Changes made:
 * - 2025-04-05: Refactored into smaller components for better maintainability
 * - 2025-04-05: Extracted UploadButton, ChangePhotoButton, PhotoUploadError, and PhotoStatusIcon
 * - 2025-04-05: Improved code organization and readability
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UploadProgress } from "../UploadProgress";
import { PhotoValidationIndicator } from "../validation/PhotoValidationIndicator";
import { UploadButton } from "./components/UploadButton";
import { ChangePhotoButton } from "./components/ChangePhotoButton";
import { PhotoUploadError } from "./components/PhotoUploadError";
import { PhotoStatusIcon } from "./components/PhotoStatusIcon";

export interface PhotoUploadProps {
  id: string;
  title?: string;
  description?: string;
  label?: string; // For backward compatibility
  isUploading: boolean;
  isRequired?: boolean;
  isUploaded?: boolean;
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
  const [localIsUploaded, setLocalIsUploaded] = useState(isUploaded);
  
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
          setLocalIsUploaded(true);
        } else {
          throw new Error("Upload failed - no file path returned");
        }
      } else if (onFileSelect) {
        await onFileSelect(file);
        
        // Reset file input
        e.target.value = '';
        setLocalIsUploaded(true);
      }
    } catch (error: any) {
      console.error(`Error uploading file "${id}":`, error);
      setError(error.message || "Failed to upload file");
    }
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
          .then(result => {
            if (result) {
              setLocalIsUploaded(true);
            }
          })
          .catch(error => {
            console.error(`Error retrying upload "${id}":`, error);
            setError(error.message || "Failed to upload file");
          });
      } else if (onFileSelect) {
        onFileSelect(file)
          .then(() => {
            setLocalIsUploaded(true);
          })
          .catch(error => {
            console.error(`Error retrying upload "${id}":`, error);
            setError(error.message || "Failed to upload file");
          });
      }
    }
  };

  // Determine if we should show the isUploaded state (either from props or local state)
  const showUploadedState = isUploaded || localIsUploaded;

  return (
    <div className="space-y-2">
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-300 h-full border",
          showUploadedState 
            ? "border-success bg-gradient-to-br from-green-50 to-white shadow-sm" 
            : "border-accent hover:border-accent/80 hover:shadow-sm"
        )}
      >
        <CardContent className="p-3">
          <div className={cn(
            "flex flex-col items-center justify-center p-4 rounded-lg text-center h-full",
            showUploadedState 
              ? "bg-gradient-to-br from-green-50 to-white" 
              : "bg-gradient-to-br from-gray-50 to-white border border-dashed border-gray-200"
          )}>
            <div className="mb-4">
              <PhotoStatusIcon isUploaded={showUploadedState} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium font-oswald">
                {displayTitle}
              </h3>
              <p className="text-xs text-subtitle">
                {showUploadedState ? "Photo successfully uploaded" : displayDescription}
              </p>
            </div>
            
            <div className="mt-4 w-full">
              {!showUploadedState ? (
                <UploadButton 
                  id={id}
                  isUploading={externalIsUploading}
                  disabled={disabled}
                  onChange={handleFileChange}
                />
              ) : (
                <ChangePhotoButton 
                  onClick={() => setLocalIsUploaded(false)} 
                />
              )}
            </div>
            
            {(externalIsUploading || localUploadProgress > 0) && !showUploadedState && (
              <div className="mt-4 w-full">
                <UploadProgress
                  progress={localUploadProgress || progress || 0}
                  error={!!error}
                  onRetry={handleRetry}
                />
              </div>
            )}
            
            <PhotoUploadError error={error || ""} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
