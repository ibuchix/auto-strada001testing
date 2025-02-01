import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Card } from "@/components/ui/card";
import { PhotoUpload } from "./photo-upload/PhotoUpload";
import { toast } from "sonner";

interface WarningLightsSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const WarningLightsSection = ({ form, carId }: WarningLightsSectionProps) => {
  const handleWarningLightPhotoUpload = async (file: File) => {
    if (!carId) {
      toast.error("Please save the form first before uploading warning light photos");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'warning_light');
    formData.append('carId', carId);

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');

      const { filePath } = await response.json();
      
      const currentPhotos = form.getValues('warningLightPhotos') || [];
      form.setValue('warningLightPhotos', [...currentPhotos, filePath]);
      
      toast.success('Warning light photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload warning light photo');
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Warning Light Photos (Optional)
      </h2>
      <div className="space-y-4">
        <PhotoUpload
          id="warning_light"
          label="Upload Warning Light Photo"
          isUploading={false}
          onFileSelect={handleWarningLightPhotoUpload}
        />
      </div>
    </Card>
  );
};