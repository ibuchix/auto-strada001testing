
/**
 * Changes made:
 * - 2024-08-04: Added disabled and isUploaded properties to PhotoUpload component
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Upload, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface PhotoUploadProps {
  id: string;
  title: string;
  description: string;
  isUploading: boolean;
  progress?: number;
  isRequired?: boolean;
  isUploaded?: boolean;
  disabled?: boolean;
  onUpload: (file: File) => Promise<string | null>;
  onRemove?: () => void;
}

export const PhotoUpload = ({
  id,
  title,
  description,
  isUploading,
  progress = 0,
  isRequired = false,
  isUploaded = false,
  disabled = false,
  onUpload,
  onRemove
}: PhotoUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setError(null);
    
    try {
      await onUpload(file);
    } catch (error) {
      setError('Failed to upload image. Please try again.');
      console.error('Photo upload error:', error);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || isUploading) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isUploading) return;
    
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  return (
    <Card 
      className={`overflow-hidden ${
        isDragging ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <CardContent className="p-4">
        <div
          className="flex flex-col items-center justify-center p-4 gap-2 border-2 border-dashed rounded-md"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ minHeight: '150px' }}
        >
          <h3 className="font-medium flex items-center">
            {title}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
            {isUploaded && <Check className="w-4 h-4 text-green-500 ml-1" />}
          </h3>
          
          <p className="text-sm text-gray-500 text-center mb-2">{description}</p>
          
          {isUploading ? (
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center">
                <Upload className="h-5 w-5 text-blue-500 animate-pulse" />
                <span className="ml-2 text-sm">Uploading...</span>
              </div>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(id)?.click()}
                disabled={disabled}
              >
                <Camera className="h-4 w-4 mr-2" />
                Browse
              </Button>
              
              {onRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
              
              <input
                id={id}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled || isUploading}
              />
            </div>
          )}
          
          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
