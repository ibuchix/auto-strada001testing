
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of warning lights section
 * - 2024-03-19: Added photo upload functionality
 * - 2024-03-19: Implemented success notifications
 * - 2027-08-12: Updated PhotoUpload props to use title and description instead of label
 * - 2028-05-30: Fixed type issues with onUpload function return type
 * - 2025-04-03: Updated to use FormDataContext instead of requiring form prop
 * - 2025-06-15: Updated to match PhotoUpload component props
 */

import { Card } from "@/components/ui/card";
import { PhotoUpload } from "./photo-upload/PhotoUpload";
import { toast } from "sonner";
import { useFormData } from "./context/FormDataContext";

interface WarningLightsSectionProps {
  carId?: string;
}

export const WarningLightsSection = ({ carId }: WarningLightsSectionProps) => {
  const { form } = useFormData();
  
  const handleWarningLightPhotoUpload = async (file: File): Promise<string | null> => {
    if (!carId) {
      toast.error("Please save the form first before uploading warning light photos");
      return null;
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
      return filePath; // Return the filePath string
    } catch (error) {
      toast.error('Failed to upload warning light photo');
      return null; // Return null on error
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
          title="Warning Light Photo"
          description="Upload a clear photo of any dashboard warning lights"
          isUploading={false}
          onUpload={handleWarningLightPhotoUpload}
        />
      </div>
    </Card>
  );
};
