
/**
 * RimPhotosSection Component
 * Created: 2025-06-12 - Extracted from PhotosSection for better organization
 * Updated: 2025-06-12 - Fixed RimPhotos type structure to match interface
 * 
 * Dedicated section for uploading rim/wheel photos
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSection } from "../FormSection";
import { useFormData } from "../context/FormDataContext";
import { Camera, X } from "lucide-react";
import { RimPhotos } from "@/types/forms";

export const RimPhotosSection = () => {
  const { form } = useFormData();
  const [rimPhotos, setRimPhotos] = useState<RimPhotos>({});

  const handleRimPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, position: keyof RimPhotos) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const objectUrl = URL.createObjectURL(file);

    const updatedPhotos = { ...rimPhotos, [position]: objectUrl };
    setRimPhotos(updatedPhotos);
    form.setValue('rimPhotos', updatedPhotos, { shouldDirty: true });
  };

  const removeRimPhoto = (position: keyof RimPhotos) => {
    const currentPhoto = rimPhotos[position];
    if (currentPhoto) {
      URL.revokeObjectURL(currentPhoto);
    }
    
    const updatedPhotos = { ...rimPhotos };
    delete updatedPhotos[position];
    setRimPhotos(updatedPhotos);
    form.setValue('rimPhotos', updatedPhotos, { shouldDirty: true });
  };

  const rimPositions: { key: keyof RimPhotos; label: string; description: string }[] = [
    { key: 'frontLeft', label: 'Front Left', description: 'Front left wheel and rim' },
    { key: 'frontRight', label: 'Front Right', description: 'Front right wheel and rim' },
    { key: 'rearLeft', label: 'Rear Left', description: 'Rear left wheel and rim' },
    { key: 'rearRight', label: 'Rear Right', description: 'Rear right wheel and rim' },
  ];

  const uploadedCount = Object.values(rimPhotos).filter(Boolean).length;

  return (
    <FormSection 
      title="Wheel & Rim Photos"
      subtitle="Upload photos of your vehicle's wheels and rims"
    >
      <Card>
        <CardHeader>
          <CardTitle>Wheel & Rim Photos</CardTitle>
          <CardDescription>
            Please upload clear photos of your vehicle's wheels and rims. Include shots of all four wheels if they differ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rimPositions.map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                {rimPhotos[key] ? (
                  <div className="relative group aspect-square">
                    <img 
                      src={rimPhotos[key]} 
                      alt={`${label} rim photo`} 
                      className="w-full h-full object-cover rounded-md border" 
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeRimPhoto(key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor={`rim-photo-${key}`}
                    className="border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center p-4">
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 text-center">{description}</span>
                    </div>
                    <input
                      id={`rim-photo-${key}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleRimPhotoUpload(e, key)}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
          {uploadedCount > 0 && (
            <p className="text-sm text-gray-600 mt-4">
              {uploadedCount}/4 rim photos uploaded
            </p>
          )}
        </CardContent>
      </Card>
    </FormSection>
  );
};
