
/**
 * PhotoUploadSection Component
 * Created: 2025-06-15
 * 
 * Photo upload section for car listing form
 */

import { useState, useCallback } from "react";
import { FormSection } from "../FormSection";
import { PhotoUpload } from "../photo-upload/PhotoUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFormData } from "../context/FormDataContext";
import { toast } from "sonner";

interface PhotoUploadSectionProps {
  carId?: string;
}

export const PhotoUploadSection = ({ carId }: PhotoUploadSectionProps) => {
  const { form } = useFormData();
  const [uploads, setUploads] = useState<Record<string, { url: string, uploading: boolean }>>({});
  
  const handlePhotoUpload = useCallback(async (file: File, photoType: string): Promise<string | null> => {
    // Mark this photo type as uploading
    setUploads(prev => ({
      ...prev,
      [photoType]: { ...prev[photoType], uploading: true }
    }));
    
    try {
      // In production, we would upload to a server here
      // For demo, create an object URL
      const photoUrl = URL.createObjectURL(file);
      
      // Update form state with the new photo
      const photoIds = form.getValues('photoIds') || [];
      form.setValue('photoIds', [...photoIds, photoType], { shouldValidate: true });
      
      // Update our local state
      setUploads(prev => ({
        ...prev,
        [photoType]: { url: photoUrl, uploading: false }
      }));
      
      toast.success(`${photoType} photo uploaded successfully`);
      return photoUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      // Update our local state to show failure
      setUploads(prev => ({
        ...prev,
        [photoType]: { ...prev[photoType], uploading: false }
      }));
      toast.error(`Failed to upload ${photoType} photo`);
      return null;
    }
  }, [form]);
  
  const handlePhotoRemove = useCallback((photoType: string): boolean => {
    try {
      // Remove from form state
      const photoIds = form.getValues('photoIds') || [];
      form.setValue(
        'photoIds', 
        photoIds.filter(id => id !== photoType),
        { shouldValidate: true }
      );
      
      // Remove from local state
      setUploads(prev => {
        const newUploads = { ...prev };
        if (newUploads[photoType]) {
          delete newUploads[photoType];
        }
        return newUploads;
      });
      
      toast.success(`${photoType} photo removed`);
      return true;
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error(`Failed to remove ${photoType} photo`);
      return false;
    }
  }, [form]);
  
  return (
    <FormSection title="Vehicle Photos" subtitle="Upload clear photos of your vehicle">
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Clear photos help your listing stand out and may lead to faster sales.
          Please upload at least one photo of your vehicle.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PhotoUpload 
          id="exterior_front"
          title="Front Exterior"
          description="Front view of the vehicle"
          isUploading={uploads.exterior_front?.uploading || false}
          isRequired={true}
          currentImage={uploads.exterior_front?.url}
          onUpload={(file) => handlePhotoUpload(file, 'exterior_front')}
          onRemove={() => handlePhotoRemove('exterior_front')}
        />
        
        <PhotoUpload 
          id="exterior_rear"
          title="Rear Exterior"
          description="Rear view of the vehicle"
          isUploading={uploads.exterior_rear?.uploading || false}
          isRequired={true}
          currentImage={uploads.exterior_rear?.url}
          onUpload={(file) => handlePhotoUpload(file, 'exterior_rear')}
          onRemove={() => handlePhotoRemove('exterior_rear')}
        />
        
        <PhotoUpload 
          id="interior_dashboard"
          title="Dashboard"
          description="Clear view of the dashboard"
          isUploading={uploads.interior_dashboard?.uploading || false}
          isRequired={true}
          currentImage={uploads.interior_dashboard?.url}
          onUpload={(file) => handlePhotoUpload(file, 'interior_dashboard')}
          onRemove={() => handlePhotoRemove('interior_dashboard')}
        />
        
        <PhotoUpload 
          id="interior_seats"
          title="Interior Seats"
          description="Clear view of the seats"
          isUploading={uploads.interior_seats?.uploading || false}
          isRequired={true}
          currentImage={uploads.interior_seats?.url}
          onUpload={(file) => handlePhotoUpload(file, 'interior_seats')}
          onRemove={() => handlePhotoRemove('interior_seats')}
        />
      </div>
    </FormSection>
  );
};
