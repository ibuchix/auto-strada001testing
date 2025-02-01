import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Card } from "@/components/ui/card";
import { PhotoUpload } from "./photo-upload/PhotoUpload";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  const handleRimPhotoUpload = async (file: File, position: string) => {
    if (!carId) {
      toast.error("Please save the form first before uploading rim photos");
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
      
      form.setValue(`rimPhotos.${position}`, filePath);
      setUploadedRims(prev => ({ ...prev, [position]: true }));
      
      toast.success(`${position.replace('_', ' ')} rim photo uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload rim photo');
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PhotoUpload
          id="rim_front_left"
          label="Front Left Rim"
          isUploading={false}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'front_left')}
        />
        <PhotoUpload
          id="rim_front_right"
          label="Front Right Rim"
          isUploading={false}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'front_right')}
        />
        <PhotoUpload
          id="rim_rear_left"
          label="Rear Left Rim"
          isUploading={false}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'rear_left')}
        />
        <PhotoUpload
          id="rim_rear_right"
          label="Rear Right Rim"
          isUploading={false}
          onFileSelect={(file) => handleRimPhotoUpload(file, 'rear_right')}
        />
      </div>
    </Card>
  );
};