/**
 * Changes made:
 * - 2024-03-19: Initial implementation of damage photo upload
 * - 2024-03-19: Added file type validation and upload handling
 * - 2024-03-19: Implemented error notifications
 */

import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { DamageType } from "../types/damages";

interface DamagePhotoUploadProps {
  damageType: DamageType;
  carId?: string;
  onPhotoUploaded: (filePath: string) => void;
}

export const DamagePhotoUpload = ({ damageType, carId, onPhotoUploaded }: DamagePhotoUploadProps) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !carId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/upload-damage-photo?carId=${carId}&damageType=${damageType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { filePath } = await response.json();
      onPhotoUploaded(filePath);
    } catch (error) {
      console.error('Error uploading damage photo:', error);
    }
  };

  return (
    <div className="space-y-2">
      <FormLabel>Photo</FormLabel>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
      />
    </div>
  );
};
