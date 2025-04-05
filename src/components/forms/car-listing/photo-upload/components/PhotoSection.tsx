
/**
 * Component for displaying a section of related photos (exterior, interior, etc.)
 * Changes made:
 * - Added a single required indicator at the section level instead of individual photos
 * - Updated styling to match brand guidelines
 * - Improved visual hierarchy with brand fonts
 * - Enhanced card layout with consistent spacing
 * - Added better responsive design for photo grid
 */
import { LucideIcon } from "lucide-react";
import { PhotoUpload } from "../PhotoUpload";
import { PhotoValidationIndicator } from "../../validation/PhotoValidationIndicator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  // Calculate upload completion for this section
  const totalPhotos = photos.length;
  const uploadedCount = photos.filter(photo => uploadedPhotos[photo.id]).length;
  const isComplete = uploadedCount === totalPhotos;
  
  return (
    <div className="space-y-6">
      <div className="border-b border-accent pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={cn(
              "h-6 w-6",
              isComplete ? "text-success" : "text-primary"
            )} />
            <h4 className="font-oswald font-semibold text-lg text-body">{title}</h4>
          </div>
          
          {allPhotosRequired && (
            <Badge 
              className={cn(
                "font-medium py-1 px-3",
                isComplete 
                  ? "bg-success hover:bg-success text-white" 
                  : "bg-primary hover:bg-primary text-white"
              )}
            >
              {isComplete ? "Complete" : "Required"}
            </Badge>
          )}
        </div>
        <p className="text-sm text-subtitle mt-2 ml-9 font-kanit">
          {description}
        </p>
        {!isComplete && (
          <p className="text-xs text-primary/80 mt-1 ml-9 font-kanit">
            {uploadedCount} of {totalPhotos} photos uploaded
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            {/* Hide individual validation indicators - we show section level instead */}
            {false && !uploadedPhotos[photo.id] && (
              <PhotoValidationIndicator 
                isUploaded={uploadedPhotos[photo.id]}
                isRequired={true}
                photoType={photo.title}
                onRetry={() => onUploadRetry(photo.id)}
                hideRequiredLabel={true}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
