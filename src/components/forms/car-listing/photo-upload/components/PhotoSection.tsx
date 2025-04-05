
/**
 * Component for displaying a section of related photos (exterior, interior, etc.)
 * Changes made:
 * - Added a single required indicator at the section level instead of individual photos
 * - Updated styling to match brand guidelines
 * - Improved visual hierarchy with brand fonts
 */
import { LucideIcon } from "lucide-react";
import { PhotoUpload } from "../PhotoUpload";
import { PhotoValidationIndicator } from "../../validation/PhotoValidationIndicator";
import { Badge } from "@/components/ui/badge";

export interface PhotoItem {
  id: string;
  title: string;
  description: string;
}

interface PhotoSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  photos: PhotoItem[];
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
  // Check if all photos in this section are required (for our styling)
  const allPhotosRequired = true;
  
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="h-6 w-6 text-primary" />
            <h4 className="font-oswald font-semibold text-lg">{title}</h4>
          </div>
          
          {allPhotosRequired && (
            <Badge className="bg-primary hover:bg-primary text-white font-medium py-1 px-3">
              Required
            </Badge>
          )}
        </div>
        <p className="text-sm text-subtitle mt-2 ml-9">
          {description}
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="space-y-1">
            <PhotoUpload
              id={photo.id}
              title={photo.title}
              description={photo.description}
              isUploading={activeUploads[photo.id] || false}
              isUploaded={uploadedPhotos[photo.id]}
              progress={progress}
              isRequired={true}
              onUpload={async (file) => {
                try {
                  const url = await onFileSelect(file, photo.id);
                  if (url) {
                    onPhotoUploaded(photo.id);
                  } else {
                    onUploadError(photo.id, "Upload failed");
                  }
                  return url;
                } catch (error: any) {
                  onUploadError(photo.id, error.message || "Upload failed");
                  return null;
                }
              }}
            />
            {/* Only show individual validation indicators for photos that are not uploaded yet */}
            {!uploadedPhotos[photo.id] && (
              <PhotoValidationIndicator 
                isUploaded={uploadedPhotos[photo.id]}
                isRequired={true}
                photoType={photo.title}
                onRetry={() => onUploadRetry(photo.id)}
                hideRequiredLabel={true} // Hide "Required" label since we have it at the section level
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
