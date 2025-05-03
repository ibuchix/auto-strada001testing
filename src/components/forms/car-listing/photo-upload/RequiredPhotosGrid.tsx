
/**
 * Grid component for required car photos
 * Created: 2025-06-20 - Fixed type and preview compatibility issues
 */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { X, Camera } from "lucide-react";

// Define the simpler FileUploader interface with only what we need
interface FileUploaderProps {
  files: { id: string; preview?: string; url: string }[];
  isUploading: boolean;
  progress: number;
  uploadFiles: (files: FileList | File[]) => Promise<any>;
  removeFile: (id: string) => boolean;
}

interface RequiredPhotosGridProps {
  frontView: FileUploaderProps;
  rearView: FileUploaderProps;
  driverSide: FileUploaderProps;
  passengerSide: FileUploaderProps;
  dashboard: FileUploaderProps;
  interiorFront: FileUploaderProps;
  interiorRear: FileUploaderProps;
}

export const RequiredPhotosGrid = ({
  frontView,
  rearView,
  driverSide,
  passengerSide,
  dashboard,
  interiorFront,
  interiorRear
}: RequiredPhotosGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <PhotoCard
        title="Front View"
        description="Full front view of the vehicle"
        uploader={frontView}
        required
      />
      <PhotoCard
        title="Rear View"
        description="Full rear view of the vehicle"
        uploader={rearView}
        required
      />
      <PhotoCard
        title="Driver Side"
        description="Full side view (driver side)"
        uploader={driverSide}
        required
      />
      <PhotoCard
        title="Passenger Side"
        description="Full side view (passenger side)"
        uploader={passengerSide}
        required
      />
      <PhotoCard
        title="Dashboard"
        description="Clear photo of the dashboard"
        uploader={dashboard}
        required
      />
      <PhotoCard
        title="Interior Front"
        description="Front seats and console area"
        uploader={interiorFront}
        required
      />
      <PhotoCard
        title="Interior Rear"
        description="Rear seats and interior"
        uploader={interiorRear}
      />
    </div>
  );
};

interface PhotoCardProps {
  title: string;
  description: string;
  uploader: FileUploaderProps;
  required?: boolean;
}

const PhotoCard = ({ title, description, uploader, required = false }: PhotoCardProps) => {
  const [error, setError] = useState<string | null>(null);
  const hasPhoto = uploader.files.length > 0;
  const photo = hasPhoto ? uploader.files[0] : null;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      uploader.uploadFiles(e.target.files).catch(err => {
        setError(err.message || "Failed to upload file");
      });
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {hasPhoto ? (
          <div className="aspect-square relative">
            <img
              src={photo?.preview || photo?.url}
              alt={title}
              className="w-full h-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={() => photo && uploader.removeFile(photo.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="aspect-square bg-gray-100 flex flex-col items-center justify-center">
            <Camera className="h-12 w-12 text-gray-300 mb-2" />
            <input
              type="file"
              accept="image/*"
              id={`upload-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploader.isUploading}
            />
            <label
              htmlFor={`upload-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-blue-600 text-sm cursor-pointer hover:underline"
            >
              Choose Photo
            </label>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          {required && !hasPhoto && (
            <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
              Required
            </span>
          )}
        </div>
        
        {uploader.isUploading && (
          <div className="mt-2">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-1 bg-blue-600 transition-all duration-300"
                style={{ width: `${uploader.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-500">Uploading...</p>
          </div>
        )}
        
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};
