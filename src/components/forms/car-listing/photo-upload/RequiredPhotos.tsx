
/**
 * Component for required photo uploads with correct type definitions
 * - 2024-08-27: Updated onFileSelect prop type to accept Promise<string | null>
 */
import { useState } from "react";
import { PhotoUpload } from "./PhotoUpload";

interface RequiredPhotosProps {
  isUploading: boolean;
  progress?: number;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
}

export const RequiredPhotos = ({ isUploading, progress, onFileSelect }: RequiredPhotosProps) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({
    exterior_front: false,
    exterior_rear: false,
    exterior_driver: false,
    exterior_passenger: false,
    interior_front: false,
    interior_rear: false,
    dashboard: false,
    odometer: false,
  });

  const handlePhotoUploaded = (type: string) => {
    setUploadedPhotos((prev) => ({
      ...prev,
      [type]: true,
    }));
  };

  const requiredPhotos = [
    {
      id: "exterior_front",
      title: "Front Exterior",
      description: "Front view of the car",
    },
    {
      id: "exterior_rear",
      title: "Rear Exterior",
      description: "Rear view of the car",
    },
    {
      id: "exterior_driver",
      title: "Driver Side",
      description: "Driver side of the car",
    },
    {
      id: "exterior_passenger",
      title: "Passenger Side",
      description: "Passenger side of the car",
    },
    {
      id: "interior_front",
      title: "Front Interior",
      description: "Front seats and dashboard",
    },
    {
      id: "interior_rear",
      title: "Rear Interior",
      description: "Rear seats",
    },
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Clear view of the dashboard",
    },
    {
      id: "odometer",
      title: "Odometer",
      description: "Current mileage reading",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Required Photos</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {requiredPhotos.map((photo) => (
          <PhotoUpload
            key={photo.id}
            id={photo.id}
            title={photo.title}
            description={photo.description}
            onUpload={async (file) => {
              const url = await onFileSelect(file, photo.id);
              if (url) handlePhotoUploaded(photo.id);
              return url;
            }}
            isUploaded={uploadedPhotos[photo.id]}
            isUploading={isUploading}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
};
