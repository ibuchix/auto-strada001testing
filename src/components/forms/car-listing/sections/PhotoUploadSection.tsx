
/**
 * Photo Upload Section
 * Created: 2025-04-12
 * Updated: 2025-05-03 - Added file validation and preview
 * Updated: 2025-07-18 - Fixed type issues with photo uploads 
 * Updated: 2025-07-27 - Fixed StoredFile type handling
 */

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { CarListingFormData, StoredFile } from "@/types/forms";
import { tempFileStorageService } from '@/services/supabase/tempFileStorageService';
import { toast } from 'sonner';
import { useFormValidation } from '../hooks/useFormValidation';

type ExtendedStoredFile = StoredFile & {
  id?: string;
  fileName?: string;
  preview?: string;
}

// Convert mixed types to a common format
const normalizeStoredFile = (file: StoredFile | string): ExtendedStoredFile => {
  if (typeof file === 'string') {
    return { 
      name: file.split('/').pop() || 'unnamed', 
      url: file,
      type: '',
      size: 0,
      uploadedAt: new Date().toISOString()
    };
  }
  return file;
};

// Get URL from stored file, regardless of format
const getPhotoUrl = (photo: StoredFile | string | null | undefined): string | null => {
  if (!photo) return null;
  return typeof photo === 'string' ? photo : photo.url;
};

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
        const storedFile: ExtendedStoredFile = typeof uploadedFile === 'string' 
          ? { name: file.name, url: uploadedFile, type: '', size: 0, uploadedAt: new Date().toISOString() }
          : { name: uploadedFile.name, url: uploadedFile.url, id: uploadedFile.id, type: '', size: 0, uploadedAt: new Date().toISOString() };
        
        // Update form values with uploaded file
        setValue('uploadedPhotos', [...(uploadedPhotos || []), storedFile]);
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
  
  // Create an effect to update required photo fields when uploadedPhotos changes
  useEffect(() => {
    // Extract photo URLs
    const photos = uploadedPhotos.map(photo => normalizeStoredFile(photo).url);
    
    // If we have photos, assign them to required fields
    if (photos.length > 0) {
      setValue('requiredPhotosComplete', photos.length >= 6);
      
      // Set first photo as front view if not set
      if (!watch('frontView') && photos.length >= 1) {
        setValue('frontView', photos[0]);
      }
      
      // Set second photo as rear view if not set
      if (!watch('rearView') && photos.length >= 2) {
        setValue('rearView', photos[1]);
      }
      
      // Set third photo as driver side if not set
      if (!watch('driverSide') && photos.length >= 3) {
        setValue('driverSide', photos[2]);
      }
      
      // Set fourth photo as passenger side if not set
      if (!watch('passengerSide') && photos.length >= 4) {
        setValue('passengerSide', photos[3]);
      }
      
      // Set fifth photo as dashboard if not set
      if (!watch('dashboard') && photos.length >= 5) {
        setValue('dashboard', photos[4]);
      }
      
      // Set sixth photo as interior front if not set
      if (!watch('interiorFront') && photos.length >= 6) {
        setValue('interiorFront', photos[5]);
      }
      
      // Set seventh photo as interior rear if not set
      if (!watch('interiorRear') && photos.length >= 7) {
        setValue('interiorRear', photos[6]);
      }
    }
  }, [uploadedPhotos, setValue, watch]);
  
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
    const normalizedPhoto = normalizeStoredFile(photo);
    
    // Remove file from storage service
    tempFileStorageService.removeFileByName(normalizedPhoto.name);
    
    // Update form values after removing file
    const updatedPhotos = uploadedPhotos.filter((p: StoredFile | string) => {
      const currentPhoto = normalizeStoredFile(p);
      return currentPhoto.name !== normalizedPhoto.name;
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
            const normalizedPhoto = normalizeStoredFile(photo);
            
            return (
              <div key={index} className="relative">
                <AspectRatio ratio={1}>
                  <img
                    src={normalizedPhoto.url}
                    alt={normalizedPhoto.name}
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
