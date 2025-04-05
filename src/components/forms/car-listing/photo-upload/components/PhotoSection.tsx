
/**
 * Component for displaying a section of related photos (exterior, interior, etc.)
 */
import { LucideIcon } from "lucide-react";
import { PhotoUpload } from "../PhotoUpload";
import { PhotoValidationIndicator } from "../../validation/PhotoValidationIndicator";

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
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-gray-600" />
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        {description}
      </p>
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
            <PhotoValidationIndicator 
              isUploaded={uploadedPhotos[photo.id]}
              isRequired={true}
              photoType={photo.title}
              onRetry={() => onUploadRetry(photo.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
