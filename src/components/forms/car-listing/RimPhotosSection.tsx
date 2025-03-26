
/**
 * Fix for photo upload property compatibility issue
 */

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface RimPhotosSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const RimPhotosSection = ({ form, carId }: RimPhotosSectionProps) => {
  const [isComplete, setIsComplete] = useState(form.getValues().rimPhotosComplete || false);

  const handlePhotoUpload = async (file: File, position: string): Promise<string> => {
    if (!file || !carId) return "";

    // Create unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${carId}/rims/${position}_${uuidv4()}.${fileExt}`;

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading rim photo:", uploadError);
      throw new Error(uploadError.message);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(fileName);

    // Update the form
    const rimPhotos = form.getValues().rimPhotos || {
      front_left: null,
      front_right: null,
      rear_left: null,
      rear_right: null
    };

    const updatedRimPhotos = {
      ...rimPhotos,
      [position]: publicUrl
    };

    form.setValue('rimPhotos', updatedRimPhotos, {
      shouldDirty: true,
      shouldValidate: true
    });

    // Check if all photos are uploaded
    const allUploaded = Object.values(updatedRimPhotos).every(val => val !== null);
    
    if (allUploaded && !isComplete) {
      setIsComplete(true);
      form.setValue('rimPhotosComplete', true, {
        shouldDirty: true
      });
    }

    return publicUrl;
  };

  const markComplete = () => {
    setIsComplete(true);
    form.setValue('rimPhotosComplete', true, {
      shouldDirty: true
    });
  };

  const rimPhotos = form.getValues().rimPhotos || {
    front_left: null,
    front_right: null,
    rear_left: null,
    rear_right: null
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-oswald font-bold text-dark">
          Wheel/Rim Photos
        </h2>
        {isComplete && (
          <div className="flex items-center text-green-600">
            <Check className="mr-1 h-5 w-5" />
            <span>Complete</span>
          </div>
        )}
      </div>

      <p className="text-muted-foreground mb-6">
        Please upload photos of all four rims to show their condition. If you don't have rim photos,
        you can mark this section as complete.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <PhotoUpload
          id="front_left"
          title="Front Left"
          description="Front left wheel"
          isUploading={false}
          isUploaded={!!rimPhotos.front_left}
          onUpload={(file) => handlePhotoUpload(file, "front_left")}
        />
        
        <PhotoUpload
          id="front_right"
          title="Front Right"
          description="Front right wheel"
          isUploading={false}
          isUploaded={!!rimPhotos.front_right}
          onUpload={(file) => handlePhotoUpload(file, "front_right")}
        />
        
        <PhotoUpload
          id="rear_left"
          title="Rear Left"
          description="Rear left wheel"
          isUploading={false}
          isUploaded={!!rimPhotos.rear_left}
          onUpload={(file) => handlePhotoUpload(file, "rear_left")}
        />
        
        <PhotoUpload
          id="rear_right"
          title="Rear Right"
          description="Rear right wheel"
          isUploading={false}
          isUploaded={!!rimPhotos.rear_right}
          onUpload={(file) => handlePhotoUpload(file, "rear_right")}
        />
      </div>

      {!isComplete && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={markComplete}
          className="mt-4"
        >
          Skip Rim Photos
        </Button>
      )}
    </Card>
  );
};
