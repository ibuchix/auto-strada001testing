
/**
 * PhotoUploadSection Component for Car Listing Form
 * Created: 2025-06-10
 * Updated: 2025-05-07 - Fixed type compatibility with ExtendedStoredFile
 * Updated: 2025-05-08 - Fixed type issues with uploadedAt property
 */
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FormLabel } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ExtendedStoredFile, CarListingFormData } from "@/types/forms";

export const PhotoUploadSection = () => {
  const { setValue, watch } = useFormContext<CarListingFormData>();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const uploadedPhotos = watch("uploadedPhotos") || [];
  
  // Simulate file upload with delay
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const newFiles = Array.from(files);
    setSelectedFiles(newFiles);
    
    // Simulate upload progress
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // After "upload" completes
    setTimeout(() => {
      clearInterval(timer);
      setUploadProgress(100);
      
      // Create file URLs and add to form
      const newUploadedPhotos: string[] = [...uploadedPhotos];
      
      newFiles.forEach(file => {
        const photoUrl = URL.createObjectURL(file);
        newUploadedPhotos.push(photoUrl);
        
        // In a real scenario, we would also upload to storage
        // and store metadata about the file
        const fileData: ExtendedStoredFile = {
          name: file.name,
          url: photoUrl,
          size: file.size,
          type: file.type,
          id: crypto.randomUUID(),
          uploadedAt: new Date().toISOString()
        };
        
        // Store file metadata if needed
        // Not actually used in this example
      });
      
      setValue("uploadedPhotos", newUploadedPhotos, { shouldDirty: true });
      
      // Reset state
      setTimeout(() => {
        setIsUploading(false);
        setSelectedFiles([]);
      }, 500);
    }, 2000);
  };
  
  const removePhoto = (index: number) => {
    const newPhotos = [...uploadedPhotos];
    newPhotos.splice(index, 1);
    setValue("uploadedPhotos", newPhotos, { shouldDirty: true });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Vehicle Photos</FormLabel>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos of your vehicle. Clear photos help your listing get more attention.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-40 border-dashed flex flex-col items-center justify-center"
            disabled={isUploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*';
              input.onchange = (e) => handleUpload((e.target as HTMLInputElement).files);
              input.click();
            }}
          >
            <Upload className="h-10 w-10 mb-2 text-gray-500" />
            <span>Click to upload photos</span>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG (max 10MB each)</p>
          </Button>
          
          {isUploading && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                Uploading {selectedFiles.length} {selectedFiles.length === 1 ? 'photo' : 'photos'}...
              </p>
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <div className="text-sm font-medium mb-2">Upload Requirements</div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• At least 3 photos of your vehicle</li>
            <li>• Include exterior front, back, and sides</li>
            <li>• Include interior dashboard and seats</li>
            <li>• Clear, well-lit images</li>
            <li>• Photos should be recent (last 30 days)</li>
          </ul>
        </Card>
      </div>
      
      {uploadedPhotos.length > 0 && (
        <div>
          <FormLabel>Uploaded Photos ({uploadedPhotos.length})</FormLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {uploadedPhotos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                <img 
                  src={photo} 
                  alt={`Vehicle photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
