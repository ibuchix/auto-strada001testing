/**
 * RimPhotosSection component
 * Created: 2025-07-24
 * Updated: 2025-07-25 - Fixed type issues with rimPhotos
 * Updated: 2025-05-15 - Added safe form context handling to prevent destructuring errors 
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { CarListingFormData, RimPhotos } from "@/types/forms";
import { useSafeFormData } from "./context/FormDataContext";

interface RimPhotosProps {
  onUpload?: (photos: RimPhotos) => void;
}

export const RimPhotosSection = ({ onUpload }: RimPhotosProps) => {
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get the form context safely
  const formDataContext = useSafeFormData();
  
  let register, setValue, watch;
  
  try {
    // Try to get form methods from context first
    if (formDataContext?.form) {
      register = formDataContext.form.register;
      setValue = formDataContext.form.setValue;
      watch = formDataContext.form.watch;
      if (isLoading) setIsLoading(false);
    } 
    // Fall back to useFormContext
    else {
      const form = useFormContext<CarListingFormData>();
      register = form.register;
      setValue = form.setValue;
      watch = form.watch;
      if (isLoading) setIsLoading(false);
    }
  } catch (err) {
    console.error("Error accessing form context in RimPhotosSection:", err);
    setError(err as Error);
    setIsLoading(false);
  }
  
  // Fallback empty object for rimPhotos if watch is unavailable
  const defaultRimPhotos = {
    front_left: '',
    front_right: '',
    rear_left: '',
    rear_right: ''
  };
  
  // Safely watch the rimPhotos field with fallback
  const rimPhotos = watch ? watch("rimPhotos") || defaultRimPhotos : defaultRimPhotos;
  
  // If still loading, show a loading indicator
  if (isLoading) {
    return <div className="p-4 text-center">Loading rim photos section...</div>;
  }
  
  // If there was an error accessing form context, show error message
  if (error || !register || !setValue || !watch) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-amber-800">
          There was an issue loading the rim photos section. Please try refreshing the page.
        </p>
      </div>
    );
  }
  
  // Handle individual image upload
  const handleImageUpload = async (position: keyof RimPhotos, file: File) => {
    setUploading(true);
    
    try {
      // Simulate upload - replace with actual upload logic
      const imageUrl = URL.createObjectURL(file);
      
      // Update form with new image URL
      const updatedRimPhotos: RimPhotos = {
        ...rimPhotos,
        [position]: imageUrl
      };
      
      // Set the form value
      setValue("rimPhotos", updatedRimPhotos, { shouldDirty: true });
      
      // Call the onUpload callback if provided
      if (onUpload) {
        onUpload(updatedRimPhotos);
      }
    } catch (error) {
      console.error(`Error uploading ${position} rim photo:`, error);
    } finally {
      setUploading(false);
    }
  };
  
  // Handle file input change
  const handleFileChange = (position: keyof RimPhotos) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(position, file);
    }
  };
  
  // Clear a specific image
  const clearImage = (position: keyof RimPhotos) => {
    const updatedRimPhotos = { ...rimPhotos };
    updatedRimPhotos[position] = '';
    
    setValue("rimPhotos", updatedRimPhotos, { shouldDirty: true });
    
    if (onUpload) {
      onUpload(updatedRimPhotos);
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Rim Photos</h3>
      <p className="text-sm text-muted-foreground">
        Please upload photos of all four rims to document their condition
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Front Left Rim */}
        <RimPhotoUploader 
          label="Front Left Rim"
          position="front_left"
          imageUrl={rimPhotos.front_left}
          onChange={handleFileChange("front_left")}
          onClear={() => clearImage("front_left")}
          disabled={uploading}
        />
        
        {/* Front Right Rim */}
        <RimPhotoUploader 
          label="Front Right Rim"
          position="front_right"
          imageUrl={rimPhotos.front_right}
          onChange={handleFileChange("front_right")}
          onClear={() => clearImage("front_right")}
          disabled={uploading}
        />
        
        {/* Rear Left Rim */}
        <RimPhotoUploader 
          label="Rear Left Rim"
          position="rear_left"
          imageUrl={rimPhotos.rear_left}
          onChange={handleFileChange("rear_left")}
          onClear={() => clearImage("rear_left")}
          disabled={uploading}
        />
        
        {/* Rear Right Rim */}
        <RimPhotoUploader 
          label="Rear Right Rim"
          position="rear_right"
          imageUrl={rimPhotos.rear_right}
          onChange={handleFileChange("rear_right")}
          onClear={() => clearImage("rear_right")}
          disabled={uploading}
        />
      </div>
    </div>
  );
};

interface RimPhotoUploaderProps {
  label: string;
  position: string;
  imageUrl?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  disabled?: boolean;
}

const RimPhotoUploader = ({
  label,
  position,
  imageUrl,
  onChange,
  onClear,
  disabled
}: RimPhotoUploaderProps) => {
  return (
    <div className="border rounded-md p-3 space-y-2">
      <p className="text-sm font-medium">{label}</p>
      
      {imageUrl ? (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={label}
            className="w-full h-48 object-cover rounded-md"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-90"
            onClick={onClear}
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded-md">
          <input
            type="file"
            id={`rim-photo-${position}`}
            accept="image/*"
            onChange={onChange}
            className="hidden"
            disabled={disabled}
          />
          <label
            htmlFor={`rim-photo-${position}`}
            className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
          >
            <div className="p-2 bg-gray-200 rounded-full mb-2">
              <svg className="w-6 h-6 text-gray-500" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">Upload Image</span>
          </label>
        </div>
      )}
    </div>
  );
};
