
/**
 * Photo Upload Component
 * Created: 2025-05-03
 * 
 * Component for uploading individual photos with preview
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface PhotoUploadProps {
  id: string;
  title: string;
  description: string;
  isUploading: boolean;
  progress: number;
  currentImage?: string;
  onUpload: (file: File) => Promise<string | null>;
  onRemove?: () => boolean | void;
}

export const PhotoUpload = ({ 
  id, 
  title, 
  description, 
  isUploading, 
  progress, 
  currentImage, 
  onUpload,
  onRemove 
}: PhotoUploadProps) => {
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setError(null);
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10MB)");
      return;
    }
    
    try {
      await onUpload(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      // Reset file input
      const fileInput = document.getElementById(id) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        <div className="text-gray-900">{title}</div>
        <div className="text-gray-500 text-xs">{description}</div>
      </div>
      
      <div className={`relative aspect-video rounded-lg overflow-hidden border-2 ${error ? 'border-red-500' : currentImage ? 'border-green-500' : 'border-dashed border-gray-300'}`}>
        {/* Image preview */}
        {currentImage ? (
          <div className="relative h-full">
            <img 
              src={currentImage} 
              alt={title}
              className="w-full h-full object-cover"
            />
            
            {/* Remove button */}
            {onRemove && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-7 w-7 rounded-full"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="h-full w-full p-4 flex flex-col items-center justify-center text-center">
            <input 
              type="file" 
              id={id} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="w-full p-4">
                <div className="mb-2 text-sm font-medium text-gray-700">
                  Uploading...
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                <label htmlFor={id} className="cursor-pointer">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-2"
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </label>
              </>
            )}
          </div>
        )}
      </div>
      
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};
