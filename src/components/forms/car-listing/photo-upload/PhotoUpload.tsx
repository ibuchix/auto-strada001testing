
/**
 * Component for handling individual photo uploads
 * - 2027-08-12: Enhanced with better validation feedback and error handling
 * - 2027-08-12: Added support for both title/description and label prop styles for backward compatibility
 */
import { useState } from "react";
import { Camera, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { UploadProgress } from "@/components/forms/car-listing/UploadProgress";
import { PhotoValidationIndicator } from "@/components/forms/car-listing/validation/PhotoValidationIndicator";
import { PhotoUploadProps } from "./types";

export const PhotoUpload = ({
  id,
  title,
  description,
  label, // Support legacy prop
  onUpload,
  onFileSelect, // Support legacy callback
  isUploaded = false,
  isUploading = false,
  progress = 0,
  isRequired = true,
  diagnosticId,
  disabled = false
}: PhotoUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  // Handle both new and legacy prop styles
  const displayTitle = title || label || "Upload Photo";
  const displayDescription = description || "Upload a clear photo";

  // Log for diagnostic purposes
  const logUploadEvent = (event: string, data: any = {}) => {
    if (diagnosticId) {
      console.log(`[${diagnosticId}] [PhotoUpload:${id}] ${event}:`, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    
    logUploadEvent('File selected', { 
      fileName: selectedFile.name, 
      fileSize: selectedFile.size 
    });
    
    // Support both callback styles
    if (onFileSelect) {
      onFileSelect(selectedFile);
      return;
    }
    
    if (!onUpload) {
      console.error("Neither onUpload nor onFileSelect provided to PhotoUpload component");
      setError("Upload configuration error");
      return;
    }
    
    try {
      const result = await onUpload(selectedFile);
      
      if (!result) {
        setError("Upload failed. Please try again.");
        logUploadEvent('Upload failed', { error: 'No result returned' });
      } else {
        logUploadEvent('Upload completed', { result });
      }
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      logUploadEvent('Upload error', { error: err.message });
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    
    if (!file) {
      setError("No file to retry. Please select a file first.");
      return;
    }
    
    logUploadEvent('Retry attempt', { 
      retryCount: retryCount + 1,
      fileName: file.name
    });
    
    // Support both callback styles on retry
    if (onFileSelect) {
      onFileSelect(file);
      return;
    }
    
    if (!onUpload) {
      return;
    }
    
    try {
      const result = await onUpload(file);
      
      if (!result) {
        setError("Retry failed. Please try again or select a different file.");
        logUploadEvent('Retry failed', { error: 'No result returned' });
      } else {
        logUploadEvent('Retry completed', { result });
      }
    } catch (err: any) {
      setError(err.message || "Retry failed. Please try again.");
      logUploadEvent('Retry error', { error: err.message });
    }
  };

  return (
    <div className="flex flex-col relative">
      <div className={`relative ${isUploaded ? 'border-green-500' : error ? 'border-red-300' : 'border-gray-300'} border-2 rounded-md p-4 h-40 flex flex-col items-center justify-center text-center transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {isUploaded ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium text-green-800">{displayTitle} uploaded</p>
          </div>
        ) : (
          <>
            <input
              type="file"
              id={id}
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading || disabled}
            />
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              {error ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : isUploading ? (
                <Upload className="h-8 w-8 text-blue-500 animate-pulse" />
              ) : (
                <Camera className="h-8 w-8 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium">{displayTitle}</p>
                <p className="text-xs text-gray-500">{displayDescription}</p>
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Progress indicator */}
      {isUploading && (
        <UploadProgress 
          progress={progress || 0} 
          error={!!error}
          onRetry={handleRetry}
          className="mt-2"
        />
      )}
      
      {/* Validation indicator */}
      <div className="absolute -top-2 -right-2">
        <PhotoValidationIndicator
          isUploaded={isUploaded}
          isRequired={isRequired}
          photoType={displayTitle}
          onRetry={!isUploaded ? handleRetry : undefined}
        />
      </div>
    </div>
  );
};
