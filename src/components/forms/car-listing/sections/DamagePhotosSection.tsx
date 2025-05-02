
/**
 * DamagePhotosSection Component
 * Created: 2025-06-16
 * 
 * Section for uploading damage photos
 */

import { useState, useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { tempFileStorage } from "@/services/temp-storage/tempFileStorageService";
import { toast } from "sonner";

export const DamagePhotosSection = () => {
  const { form } = useFormData();
  const [damagePhotos, setDamagePhotos] = useState<{ id: string, preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const isDamaged = form.watch("isDamaged");
  
  // Don't show section if vehicle is not damaged
  if (!isDamaged) return null;
  
  // Setup dropzone for damage photos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": []
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error("Some files were rejected", {
          description: "Files must be images under 5MB"
        });
      }

      if (acceptedFiles.length > 0) {
        setIsUploading(true);
        
        try {
          const newPhotos = [];
          
          for (const file of acceptedFiles) {
            // Store in temporary storage
            const storedFile = await tempFileStorage.addFile(file, "damage_photos");
            
            // Add to local state
            newPhotos.push({
              id: storedFile.id,
              preview: storedFile.url
            });
          }
          
          // Update local state
          setDamagePhotos(prev => [...prev, ...newPhotos]);
          
          // Update form state - we just need URLs for now
          const existingPhotos = form.getValues("damagePhotos") || [];
          form.setValue("damagePhotos", [
            ...existingPhotos,
            ...newPhotos.map(p => p.preview)
          ]);
          
          toast.success(`${acceptedFiles.length} damage photo(s) uploaded`);
        } catch (error) {
          console.error("Error uploading damage photos:", error);
          toast.error("Failed to upload damage photos");
        } finally {
          setIsUploading(false);
        }
      }
    }
  });
  
  // Remove a damage photo
  const removePhoto = (index: number) => {
    const updatedPhotos = [...damagePhotos];
    const photoToRemove = updatedPhotos[index];
    
    // Remove from temp storage
    tempFileStorage.removeFile(photoToRemove.id);
    
    // Remove from state
    updatedPhotos.splice(index, 1);
    setDamagePhotos(updatedPhotos);
    
    // Update form values
    const currentPhotos = form.getValues("damagePhotos") || [];
    currentPhotos.splice(index, 1);
    form.setValue("damagePhotos", currentPhotos);
    
    toast.info("Damage photo removed");
  };
  
  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      damagePhotos.forEach(photo => {
        URL.revokeObjectURL(photo.preview);
      });
    };
  }, []);
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Damage Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${
            isDragActive ? "border-primary bg-primary/10" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            {isDragActive ? (
              <p>Drop the photos here...</p>
            ) : (
              <p>Drag and drop damage photos here, or click to select files</p>
            )}
            <p className="text-sm text-gray-500">
              Upload clear photos of any damage to your vehicle
            </p>
          </div>
        </div>
        
        {isUploading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Uploading...</span>
          </div>
        )}
        
        {damagePhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {damagePhotos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.preview}
                  alt={`Damage photo ${index + 1}`}
                  className="h-32 w-full object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
