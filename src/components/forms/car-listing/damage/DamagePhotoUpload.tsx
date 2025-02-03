import { Label } from "@/components/ui/label";
import { PhotoUpload } from "../photo-upload/PhotoUpload";
import { DamageType } from "../types/damages";
import { toast } from "sonner";

interface DamagePhotoUploadProps {
  damageType: DamageType;
  carId?: string;
  onPhotoUploaded: (filePath: string) => void;
}

export const DamagePhotoUpload = ({ damageType, carId, onPhotoUploaded }: DamagePhotoUploadProps) => {
  const handleDamagePhotoUpload = async (file: File) => {
    if (!carId) {
      toast.error("Please save the form first before uploading damage photos");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', `damage_${damageType}`);
    formData.append('carId', carId);

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');

      const { filePath } = await response.json();
      onPhotoUploaded(filePath);
      
      toast.success('Damage photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload damage photo');
    }
  };

  return (
    <div>
      <Label>Upload Photo</Label>
      <PhotoUpload
        id={`damage_${damageType}`}
        label="Upload damage photo"
        isUploading={false}
        onFileSelect={handleDamagePhotoUpload}
      />
    </div>
  );
};