
/**
 * Photo Upload Section
 * Created: 2025-04-12
 * Updated: 2025-05-03 - Added file validation and preview
 * Updated: 2025-07-18 - Fixed type issues with photo uploads 
 */

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { CarListingFormData } from "@/types/forms";
import { tempFileStorageService } from '@/services/supabase/tempFileStorageService';
import { toast } from 'sonner';
import { useFormValidation } from '../hooks/useFormValidation';

// Define a StoredFile type to handle both string and object-based files
interface StoredFile {
  id?: string;
  name: string;
  url: string;
}

export const PhotoUploadSection = () => {
  const { register, setValue, watch } = useFormContext<CarListingFormData>();
  const [uploading, setUploading] = useState(false);
  const uploadedPhotos = watch('uploadedPhotos') || [];
  const { validateCurrentStep } = useFormValidation(useFormContext<CarListingFormData>());
  
  // Handle file upload function
  const handleFileUpload = async (files: File[]) => {
    if (!files?.length) return;
    
    try {
      setUploading(true);
      
      // Upload one file at a time
      for (const file of files) {
        // This should now work with the updated tempFileStorageService
        const uploadedFile = await tempFileStorageService.addFile(file);
        
        // Convert the response to a StoredFile if needed
        const storedFile: StoredFile = typeof uploadedFile === 'string' 
          ? { name: file.name, url: uploadedFile }
          : { name: uploadedFile.name, url: uploadedFile.url, id: uploadedFile.id };
        
        // Update form values with uploaded file
        setValue('uploadedPhotos', [...uploadedPhotos, storedFile]);
      }
      
      toast.success("Photos uploaded successfully.");
    } catch (error: any) {
      console.error("File upload error:", error);
      toast.error(error.message || "Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
      await validateCurrentStep();
    }
  };
  
  // Initialize uploaded photos from form values
  useEffect(() => {
    // No additional initialization needed
  }, [uploadedPhotos, setValue]);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    handleFileUpload(acceptedFiles);
  }, [handleFileUpload]);
  
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg']
    },
    maxFiles: 10,
    multiple: true
  });
  
  const handleRemovePhoto = (photo: StoredFile | string) => {
    // Extract name from either string or object
    const fileName = typeof photo === 'string' ? 
      photo : 
      photo.name;
    
    // Remove file from storage service
    tempFileStorageService.removeFileByName(fileName);
    
    // Update form values after removing file
    const updatedPhotos = uploadedPhotos.filter((p: StoredFile | string) => {
      const currentName = typeof p === 'string' ? p : p.name;
      return currentName !== fileName;
    });
    
    setValue('uploadedPhotos', updatedPhotos);
    
    toast.success("Photo removed successfully.");
  };
  
  return (
    <div className="grid gap-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-md p-6 text-center cursor-pointer
          ${isDragActive ? 'border-primary' : 'border-gray-300'}
        `}
      >
        <input {...getInputProps()} />
        <Camera className="mx-auto h-6 w-6 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          {isDragActive ? "Drop the files here..." : "Click or drag photos to upload"}
        </p>
        <p className="text-xs text-gray-400">
          Accepts .png, .jpg, .jpeg (Max 10 files)
        </p>
      </div>
      
      {uploading && (
        <div className="text-center">
          Uploading...
        </div>
      )}
      
      {uploadedPhotos && uploadedPhotos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {uploadedPhotos.map((photo: StoredFile | string, index: number) => {
            // Handle both string and object formats
            const photoUrl = typeof photo === 'string' ? photo : photo.url;
            const photoName = typeof photo === 'string' ? `Photo ${index + 1}` : photo.name;
            
            return (
              <div key={index} className="relative">
                <AspectRatio ratio={1}>
                  <img
                    src={photoUrl}
                    alt={photoName}
                    className="object-cover rounded-md"
                  />
                </AspectRatio>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background rounded-full shadow-md hover:bg-muted"
                  onClick={() => handleRemovePhoto(photo)}
                >
                  <span className="sr-only">Remove photo</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </div>
            );
          })}
        </div>
      )}
      
      <input type="hidden" {...register("uploadedPhotos")} />
    </div>
  );
};
