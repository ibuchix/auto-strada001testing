
/**
 * PhotoUpload Component
 * Created: 2025-06-15
 * 
 * Generic photo upload component for car listing form
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDropzone } from 'react-dropzone';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';

export interface PhotoUploadProps {
  id: string;
  title: string;
  description: string;
  isUploading: boolean;
  isRequired?: boolean;
  progress?: number;
  currentImage?: string;
  onUpload: (file: File) => Promise<string | null>;
  onRemove?: () => void | boolean;
}

export const PhotoUpload = ({
  id,
  title,
  description,
  isUploading,
  isRequired = false,
  progress = 0,
  currentImage,
  onUpload,
  onRemove
}: PhotoUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      try {
        setError(null);
        
        if (file.size > 10 * 1024 * 1024) {
          setError('Image too large (max 10MB)');
          return;
        }
        
        await onUpload(file);
      } catch (err) {
        setError('Upload failed');
        console.error('Upload failed:', err);
      }
    },
    [onUpload]
  );
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isUploading || !!currentImage,
    maxFiles: 1
  });
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <h3 className="font-medium text-base mb-2 flex items-center">
          {title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        
        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt={title}
              className="w-full h-48 object-cover rounded-md"
            />
            {onRemove && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={() => onRemove()}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="space-y-3">
                <Camera className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-sm">Uploading...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {isDragActive ? (
                  <>
                    <Camera className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-sm">Drop the image here</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-sm">Drag & drop or click to upload</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </Card>
  );
};
