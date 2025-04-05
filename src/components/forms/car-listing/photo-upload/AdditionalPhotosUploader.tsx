
/**
 * Component for uploading additional photos to a car listing
 * - Supports drag & drop and click-to-upload
 * - Shows upload progress indicator
 * - Displays errors with clear messaging
 * - 2025-04-06: Updated to match app design system
 */
import React from 'react';
import { AlertCircle, UploadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdditionalPhotosProps } from './types';
import { Card } from '@/components/ui/card';

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
    <div className="mt-8 animate-fade-in">
      <h4 className="text-base font-kanit font-medium mb-3 text-body">Additional Photos</h4>
      
      {error && (
        <Alert variant="destructive" className="mb-4 bg-primary/10 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="font-kanit">{error.message}</AlertTitle>
          {error.description && <AlertDescription className="font-kanit text-sm">{error.description}</AlertDescription>}
        </Alert>
      )}
      
      <Card 
        className={`border-dashed border-2 border-accent rounded-lg p-6 text-center cursor-pointer hover:bg-accent/5 transition-colors ${isMobile ? 'min-h-[120px] flex items-center justify-center' : ''}`}
        onClick={handleFileSelect}
      >
        {isUploading ? (
          <div className="w-full">
            <p className="text-sm text-subtitle mb-2 font-kanit">Uploading...</p>
            <div className="w-full bg-accent rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className={isMobile ? "px-4" : ""}>
            <UploadCloud className="mx-auto h-8 w-8 text-subtitle mb-2" />
            <p className="text-sm text-subtitle font-kanit">
              {isMobile ? "Tap to upload photos" : "Drag & drop photos here or click to browse"}
            </p>
            <p className="text-xs text-subtitle/80 mt-1 font-kanit">
              JPG, PNG, or WEBP (max 10MB)
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
