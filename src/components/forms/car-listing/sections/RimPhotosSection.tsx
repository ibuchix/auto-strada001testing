
/**
 * RimPhotosSection Component
 * Created: 2025-06-12 - Extracted from PhotosSection for better organization
 * 
 * Dedicated section for uploading rim/wheel photos
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSection } from "../FormSection";
import { useFormData } from "../context/FormDataContext";
import { Camera, X } from "lucide-react";

export const RimPhotosSection = () => {
  const { form } = useFormData();
  const [rimPhotos, setRimPhotos] = useState<string[]>([]);

  const handleRimPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newPhotoUrls: string[] = [];
    
    Array.from(e.target.files).forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      newPhotoUrls.push(objectUrl);
    });

    const updatedPhotos = [...rimPhotos, ...newPhotoUrls];
    setRimPhotos(updatedPhotos);
    form.setValue('rimPhotos', updatedPhotos, { shouldDirty: true });
  };

  const removeRimPhoto = (index: number) => {
    const updatedPhotos = [...rimPhotos];
    URL.revokeObjectURL(updatedPhotos[index]);
    updatedPhotos.splice(index, 1);
    setRimPhotos(updatedPhotos);
    form.setValue('rimPhotos', updatedPhotos, { shouldDirty: true });
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {rimPhotos.map((photo, index) => (
              <div key={index} className="relative group aspect-square">
                <img 
                  src={photo} 
                  alt={`Rim photo ${index + 1}`} 
                  className="w-full h-full object-cover rounded-md border" 
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeRimPhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {rimPhotos.length < 8 && (
              <label
                htmlFor="rim-photos-upload"
                className="border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex flex-col items-center justify-center p-4">
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Rim Photo</span>
                </div>
                <input
                  id="rim-photos-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleRimPhotoUpload}
                />
              </label>
            )}
          </div>
          {rimPhotos.length > 0 && (
            <p className="text-sm text-gray-600 mt-4">
              {rimPhotos.length}/8 rim photos uploaded
            </p>
          )}
        </CardContent>
      </Card>
    </FormSection>
  );
};
