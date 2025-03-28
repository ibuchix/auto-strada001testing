/**
 * Component for uploading additional photos to a car listing
 * - Supports drag & drop and click-to-upload
 * - Shows upload progress indicator
 * - Displays errors with clear messaging
 */
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdditionalPhotosProps } from './types';

export const AdditionalPhotosUploader = ({ 
  isUploading, 
  onPhotosSelected, 
  progress, 
  error 
}: AdditionalPhotosProps) => {
  const isMobile = useIsMobile();

  const handleDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await onPhotosSelected(acceptedFiles);
  };

  const handleFileSelect = () => {
    // Create and trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      if (e.target.files) {
        handleDrop(Array.from(e.target.files));
      }
    };
    input.click();
  };

  return (
    <div className="mt-6">
      <h4 className="text-base font-medium mb-3">Additional Photos</h4>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.message}</AlertTitle>
          {error.description && <AlertDescription>{error.description}</AlertDescription>}
        </Alert>
      )}
      
      <div 
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${isMobile ? 'min-h-[120px] flex items-center justify-center' : ''}`}
        onClick={handleFileSelect}
      >
        {isUploading ? (
          <div className="w-full">
            <p className="text-sm text-gray-500 mb-2">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className={isMobile ? "px-4" : ""}>
            <p className="text-sm text-gray-500">{isMobile ? "Tap to upload photos" : "Drag & drop photos here or click to browse"}</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WEBP (max 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};
