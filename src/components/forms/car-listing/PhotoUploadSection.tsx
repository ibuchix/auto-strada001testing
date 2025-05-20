
/**
 * Changes made:
 * - 2025-05-20 - Updated field names to use snake_case to match database schema
 */

import { useState, useCallback } from "react";
import { useFormData } from "./context/FormDataContext";
import { Button } from "@/components/ui/button";
import { Upload, X, Image } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadSectionProps {
  title: string;
  description?: string;
  maxPhotos?: number;
  fieldName: string;
}

export const PhotoUploadSection = ({
  title,
  description,
  maxPhotos = 10,
  fieldName,
}: PhotoUploadSectionProps) => {
  const { form } = useFormData();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Get current photos from form
  const photosList = form.watch(fieldName) || [];
  
  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;
      
      // Check if adding these files would exceed the limit
      if (photosList.length + files.length > maxPhotos) {
        toast.error(`Maximum ${maxPhotos} photos allowed`);
        return;
      }
      
      setUploading(true);
      
      try {
        // Create array of new photo URLs
        const newPhotoUrls = await Promise.all(
          Array.from(files).map((file) => {
            return new Promise<string>((resolve) => {
              // In a real app you'd upload to a server
              // Here we just create object URLs as placeholders
              const objectUrl = URL.createObjectURL(file);
              resolve(objectUrl);
            });
          })
        );
        
        // Update form with new photos
        const updatedPhotos = [...photosList, ...newPhotoUrls];
        form.setValue(fieldName, updatedPhotos, { shouldDirty: true });
        
        toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading photos:", error);
        toast.error("Failed to upload photos. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [form, fieldName, photosList, maxPhotos]
  );
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(Array.from(e.target.files));
    }
  };
  
  // Remove a photo
  const removePhoto = (index: number) => {
    const updatedPhotos = [...photosList];
    URL.revokeObjectURL(updatedPhotos[index]);
    updatedPhotos.splice(index, 1);
    form.setValue(fieldName, updatedPhotos, { shouldDirty: true });
  };
  
  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  
  const handleDragLeave = () => {
    setDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 ${
          dragOver ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
          <h4 className="mb-2 text-sm font-medium">Drag & drop photos here</h4>
          <p className="mb-4 text-xs text-muted-foreground">
            Supported formats: JPEG, PNG, JPG
          </p>
          <input
            id={`${fieldName}-upload`}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={uploading}
          />
          <label htmlFor={`${fieldName}-upload`}>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Select Files"}
              </span>
            </Button>
          </label>
        </div>
      </div>
      
      {photosList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {photosList.map((photo, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-md border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
