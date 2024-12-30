import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhotoUploadSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const PhotoUploadSection = ({ form, carId }: PhotoUploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File, type: string) => {
    if (!carId) {
      toast.error("Car ID is required for file upload");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${carId}/${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('car-files')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Log the upload
      const { error: logError } = await supabase
        .from('car_file_uploads')
        .insert({
          car_id: carId,
          file_path: filePath,
          file_type: type,
          upload_status: 'completed'
        });

      if (logError) throw logError;

      // Update the car's required_photos or additional_photos
      const updates = type.includes('additional') 
        ? { additional_photos: supabase.sql`array_append(additional_photos, ${filePath})` }
        : { required_photos: supabase.sql`jsonb_set(required_photos, '{${type}}', '"${filePath}"')` };

      const { error: updateError } = await supabase
        .from('cars')
        .update(updates)
        .eq('id', carId);

      if (updateError) throw updateError;

      toast.success(`${type} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setIsUploading(false);
    }
  };

  const requiredPhotos = [
    { id: 'driver_side_front', label: "Driver's Side Front" },
    { id: 'front', label: 'Front of Car' },
    { id: 'passenger_side_front', label: 'Passenger Side Front' },
    { id: 'front_seats', label: 'Front Seats' },
    { id: 'back_seats', label: 'Back Seats' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'back', label: 'Back of Car' },
    { id: 'driver_side', label: "Driver's Side" },
    { id: 'passenger_side', label: 'Passenger Side' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Required Photos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredPhotos.map(({ id, label }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id}>{label}</Label>
              <Input
                id={id}
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, id);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Additional Photos (Optional)</h3>
        <p className="text-sm text-gray-600 mb-2">Upload up to 5 additional photos showing any damage or special features</p>
        <Input
          type="file"
          accept="image/*"
          multiple
          disabled={isUploading}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            files.slice(0, 5).forEach((file, index) => {
              handleFileUpload(file, `additional_${index}`);
            });
          }}
        />
      </div>
    </div>
  );
};