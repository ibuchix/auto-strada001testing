
/**
 * Required Photos Component
 * Created: 2025-05-12
 * Updated: 2025-05-20 - Added support for all required photo fields including odometer
 * 
 * Displays required photos section with proper validation
 */

import React from 'react';
import { exteriorPhotos, interiorPhotos } from './data/requiredPhotoData';
import { PhotoSection } from './components/PhotoSection';
import { useFormContext } from 'react-hook-form';
import { Camera, Gauge } from 'lucide-react';

interface RequiredPhotosProps {
  isUploading: boolean;
  progress: number;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
}

export const RequiredPhotos: React.FC<RequiredPhotosProps> = ({
  isUploading,
  progress,
  onFileSelect
}) => {
  const [uploads, setUploads] = React.useState<Record<string, boolean>>({});
  const [active, setActive] = React.useState<Record<string, boolean>>({});
  const form = useFormContext();

  // Track which photos have been uploaded
  const handlePhotoUploaded = (type: string) => {
    setUploads(prev => ({
      ...prev,
      [type]: true
    }));
    setActive(prev => ({
      ...prev,
      [type]: false
    }));
  };

  // Track active uploads
  const handleUploadStart = (type: string) => {
    setActive(prev => ({
      ...prev,
      [type]: true
    }));
  };

  // Update uploads from form values when component mounts
  React.useEffect(() => {
    if (!form) return;
    
    // Get form values for vehicle photos
    const formValues = form.getValues();
    const newUploads: Record<string, boolean> = {};
    
    // Check for existing photo values and mark as uploaded
    exteriorPhotos.forEach(photo => {
      if (formValues[photo.id] || 
          (formValues.vehiclePhotos && formValues.vehiclePhotos[photo.id])) {
        newUploads[photo.id] = true;
      }
    });
    
    interiorPhotos.forEach(photo => {
      if (formValues[photo.id] || 
          (formValues.vehiclePhotos && formValues.vehiclePhotos[photo.id])) {
        newUploads[photo.id] = true;
      }
    });
    
    setUploads(newUploads);
  }, [form]);

  return (
    <div className="space-y-8">
      <PhotoSection
        title="Exterior Photos"
        description="Upload clear photos of your vehicle's exterior from different angles"
        icon={Camera}
        photos={exteriorPhotos}
        uploadedPhotos={uploads}
        activeUploads={active}
        progress={progress}
        onFileSelect={onFileSelect}
        onPhotoUploaded={handlePhotoUploaded}
        onUploadRetry={() => {}}
      />
      
      <PhotoSection
        title="Interior & Dashboard"
        description="Show the condition of your vehicle's interior, dashboard, and current odometer reading"
        icon={Gauge}
        photos={interiorPhotos}
        uploadedPhotos={uploads}
        activeUploads={active}
        progress={progress}
        onFileSelect={onFileSelect}
        onPhotoUploaded={handlePhotoUploaded}
        onUploadRetry={() => {}}
      />
    </div>
  );
};
