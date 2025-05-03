/**
 * Damage Photos Section
 * Created: 2025-04-12
 * Updated: 2025-05-03 - Added image validation and upload progress
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileImage, Upload, X } from 'lucide-react';
import { CarListingFormData } from '@/types/forms';
import { tempFileStorageService } from '@/services/supabase/tempFileStorageService';

interface DamagePhotosSectionProps {
  sectionKey: string;
}

export const DamagePhotosSection: React.FC<DamagePhotosSectionProps> = ({ sectionKey }) => {
  const { register, setValue, watch } = useFormContext<CarListingFormData>();
  const [uploading, setUploading] = useState(false);
  const damagePhotos = watch('damagePhotos') || [];
  
  // Initialize damagePhotos if it's null or undefined
  useEffect(() => {
    if (!damagePhotos) {
      setValue('damagePhotos', []);
    }
  }, [damagePhotos, setValue]);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return;
    
    // Validate file types and sizes
    const validFiles = acceptedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });
    
    if (!validFiles.length) return;
    
    // Upload each valid file
    for (const file of validFiles) {
      await handleAddImage(file);
    }
  }, [handleAddImage]);
  
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  });
  
  const handleAddImage = async (file: File) => {
    if (!file) return;
    
    try {
      setUploading(true);
      
      // This should now work with the updated tempFileStorageService
      const uploadedFile = await tempFileStorageService.addFile(file);
      
      setValue('damagePhotos', [...damagePhotos, uploadedFile.id]);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveImage = (imageId: string) => {
    // This should now work with the updated tempFileStorageService
    tempFileStorageService.removeFile(imageId);
    setValue(
      'damagePhotos',
      damagePhotos.filter((id) => id !== imageId)
    );
  };
  
  return (
    <div className="space-y-4">
      <Label htmlFor={`${sectionKey}-damagePhotos`}>
        Damage Photos
      </Label>
      
      <div 
        {...getRootProps()} 
        className={`
          relative border-2 border-dashed rounded-md p-6 cursor-pointer
          ${isDragActive ? 'border-primary' : 'border-gray-300'}
        `}
      >
        <input {...getInputProps()} id={`${sectionKey}-damagePhotos`} />
        
        <div className="text-center">
          <Upload className="mx-auto h-6 w-6 text-gray-500 mb-2" />
          <p className="text-sm text-gray-500">
            {isDragActive ? "Drop the files here..." : "Drag 'n' drop some files here, or click to select files"}
          </p>
          <p className="text-xs text-gray-500">
            (Only images *.jpeg, *.png, *.gif and max size of 5MB will be accepted)
          </p>
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          </div>
        )}
      </div>
      
      {damagePhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {damagePhotos.map((imageId) => {
            const file = tempFileStorageService.getFile(imageId);
            
            return file ? (
              <div key={imageId} className="relative">
                <img 
                  src={file.url} 
                  alt={file.name} 
                  className="rounded-md object-cover aspect-square" 
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => handleRemoveImage(imageId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Alert variant="destructive">
                <FileImage className="h-4 w-4" />
                <AlertDescription>
                  Could not load image
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}
      
      <Input
        type="hidden"
        id={`${sectionKey}-damagePhotos`}
        {...register('damagePhotos')}
      />
    </div>
  );
};
