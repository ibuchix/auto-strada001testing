
/**
 * Component for displaying a section of photo uploads
 * - 2025-04-05: Created to provide better section organization
 * - 2025-04-05: Enhanced with better visual styling and animations
 * - 2025-04-05: Added PhotoItem interface and exported it for use in other files
 */
import { LucideIcon } from "lucide-react";
import { PhotoUpload } from "../PhotoUpload";
import { PhotoValidationIndicator } from "../../validation/PhotoValidationIndicator";
import { cn } from "@/lib/utils";

// Export this interface so it can be used in requiredPhotoData.ts
export interface PhotoItem {
  id: string;
  title: string;
  description: string;
  required?: boolean;
}

interface PhotoSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  photos: { id: string; title: string; description: string; required: boolean }[];
  uploadedPhotos: Record<string, boolean>;
  activeUploads: Record<string, boolean>;
  progress?: number;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
  onPhotoUploaded: (type: string) => void;
  onUploadError: (type: string, error: string) => void;
  onUploadRetry: (type: string) => void;
}

export const PhotoSection = ({
  title,
  description,
  icon: Icon,
  photos,
  uploadedPhotos,
  activeUploads,
  progress,
  onFileSelect,
  onPhotoUploaded,
  onUploadError,
  onUploadRetry
}: PhotoSectionProps) => {
  // Check if all photos in this section are required
  const allPhotosRequired = photos.every(photo => photo.required);
  
  // Check if all required photos are uploaded
  const allRequiredUploaded = photos
    .filter(photo => photo.required)
    .every(photo => uploadedPhotos[photo.id]);
  
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-accent/80 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-oswald text-dark">{title}</h3>
        </div>
        
        {allPhotosRequired && (
          <PhotoValidationIndicator
            isUploaded={allRequiredUploaded}
            isRequired={true}
            photoType={title}
            hideRequiredLabel={!allRequiredUploaded}
          />
        )}
      </div>
      
      <p className="text-sm text-subtitle">{description}</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className={cn(
            "transition-all duration-500 transform",
            uploadedPhotos[photo.id] ? "scale-100 opacity-100" : "hover:scale-[1.02]"
          )}>
            <PhotoUpload
              id={photo.id}
              title={photo.title}
              description={photo.description}
              isUploading={!!activeUploads[photo.id]}
              isRequired={photo.required}
              isUploaded={!!uploadedPhotos[photo.id]}
              progress={progress}
              onFileSelect={(file) => 
                onFileSelect(file, photo.id)
                  .then((result) => {
                    if (result) {
                      onPhotoUploaded(photo.id);
                    }
                    return result;
                  })
                  .catch((error) => {
                    onUploadError(photo.id, error.message || "Upload failed");
                    return null;
                  })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
