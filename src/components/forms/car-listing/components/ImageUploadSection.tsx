
/**
 * Image Upload Section for car listing forms
 * Created: 2025-06-04
 * 
 * This component handles image uploads and prevents auto-saving during uploads
 * to avoid performance issues and flickering.
 */

import { useCallback, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useFormController } from "../hooks/useFormController";
import { useImageUploadManager } from "../hooks/useImageUploadManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, ImageIcon } from "lucide-react";

interface ImageUploadSectionProps {
  maxImages?: number;
  carId?: string;
  pauseAutoSave?: () => void;
  resumeAutoSave?: () => void;
}

export const ImageUploadSection = ({
  maxImages = 10,
  carId,
  pauseAutoSave,
  resumeAutoSave
}: ImageUploadSectionProps) => {
  const form = useFormContext<CarListingFormData>();
  const [images, setImages] = useState<string[]>([]);
  
  // Use the image upload manager to handle uploads and auto-save pausing
  const {
    isUploading,
    uploadProgress,
    startUpload,
    finishUpload,
    updateProgress
  } = useImageUploadManager({ 
    form, 
    pauseAutoSave, 
    resumeAutoSave, 
    carId 
  });
  
  // Initialize images from form data on mount
  useEffect(() => {
    const formImages = form.getValues('images') || [];
    setImages(Array.isArray(formImages) ? formImages : []);
  }, [form]);
  
  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!carId || images.length >= maxImages) return;
    
    // Start upload process - this will pause auto-save
    startUpload();
    
    try {
      const newImages = [...images];
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        if (newImages.length >= maxImages) break;
        
        const file = acceptedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Update progress as we process each file
        updateProgress(Math.round((i / acceptedFiles.length) * 100));
        
        // Upload image
        const response = await fetch(`/api/upload-car-image?carId=${carId}`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const { filePath } = await response.json();
        newImages.push(filePath);
      }
      
      // Update local state and form
      setImages(newImages);
      form.setValue('images', newImages, { shouldDirty: true });
      
      // Complete upload successfully
      finishUpload(true);
    } catch (error) {
      console.error('Error uploading images:', error);
      finishUpload(false, error instanceof Error ? error : new Error('Upload failed'));
    }
  }, [carId, images, maxImages, startUpload, updateProgress, finishUpload, form]);
  
  // Set up dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isUploading || !carId || images.length >= maxImages
  });
  
  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    form.setValue('images', newImages, { shouldDirty: true });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <FormLabel>Car Images</FormLabel>
        <p className="text-sm text-muted-foreground mb-2">
          Upload up to {maxImages} images of your car. First image will be the main image.
        </p>
      </div>
      
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-12 w-12 mx-auto text-gray-400" />
        
        {isUploading ? (
          <div className="mt-4">
            <p className="text-sm font-medium">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            {isDragActive
              ? "Drop the images here"
              : images.length >= maxImages
              ? "Maximum number of images reached"
              : "Drag and drop images here, or click to select"}
          </p>
        )}
      </div>
      
      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden bg-gray-100 border">
                {image.startsWith('http') || image.startsWith('/') ? (
                  <img
                    src={image}
                    alt={`Car image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              
              {/* Main image indicator */}
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
