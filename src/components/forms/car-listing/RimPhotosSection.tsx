
/**
 * Changes made:
 * - 2024-08-09: Created RimPhotosSection component for rim photo uploads
 * - 2024-09-15: Added state tracking for uploaded rims
 * - 2027-08-03: Improved error handling when carId is not available
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Card } from "@/components/ui/card";
import { PhotoUpload } from "./photo-upload/PhotoUpload";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RimPhotosSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const RimPhotosSection = ({ form, carId }: RimPhotosSectionProps) => {
  const [uploadedRims, setUploadedRims] = useState({
    front_left: false,
    front_right: false,
    rear_left: false,
    rear_right: false
  });
  
  const [missingCarId, setMissingCarId] = useState(false);

  // Check if carId is available on mount and when it changes
  useEffect(() => {
    setMissingCarId(!carId);
  }, [carId]);

  const handleRimPhotoUpload = async (file: File, position: keyof typeof uploadedRims) => {
    if (!carId) {
      setMissingCarId(true);
      toast.error("Unable to upload photos", {
        description: "Please save the form first before uploading rim photos"
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', `rim_${position}`);
    formData.append('carId', carId);

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');

      const { filePath } = await response.json();
      
      const currentRimPhotos = form.getValues('rimPhotos') || {
        front_left: null,
        front_right: null,
        rear_left: null,
        rear_right: null
      };

      form.setValue('rimPhotos', {
        ...currentRimPhotos,
        [position]: filePath
      });
      
      setUploadedRims(prev => ({ ...prev, [position]: true }));
      
      toast.success(`${position.replace('_', ' ')} rim photo uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload rim photo');
      console.error('Rim photo upload error:', error);
    }
  };

  useEffect(() => {
    const allRimsUploaded = Object.values(uploadedRims).every(Boolean);
    if (allRimsUploaded) {
      form.setValue('rimPhotosComplete', true);
    }
  }, [uploadedRims, form]);

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Rim Photos
      </h2>
      
      {missingCarId && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please save your form progress before uploading rim photos. 
            Navigate to another section and back if this message persists.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PhotoUpload
          id="rim_front_left"
          label="Front Left Rim"
          isUploading={false}
          disabled={missingCarId}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'front_left')}
        />
        <PhotoUpload
          id="rim_front_right"
          label="Front Right Rim"
          isUploading={false}
          disabled={missingCarId}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'front_right')}
        />
        <PhotoUpload
          id="rim_rear_left"
          label="Rear Left Rim"
          isUploading={false}
          disabled={missingCarId}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'rear_left')}
        />
        <PhotoUpload
          id="rim_rear_right"
          label="Rear Right Rim"
          isUploading={false}
          disabled={missingCarId}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'rear_right')}
        />
      </div>
    </Card>
  );
};
