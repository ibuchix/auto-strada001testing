
/**
 * DamagePhotosSection Component
 * Created: 2025-06-15
 * 
 * Damage photos section for car listing form
 */

import { useState, useCallback } from "react";
import { FormSection } from "../FormSection";
import { PhotoUpload } from "../photo-upload/PhotoUpload";
import { useFormData } from "../context/FormDataContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const DamagePhotosSection = () => {
  const { form } = useFormData();
  const isDamaged = form.watch('isDamaged');
  const [isUploading, setIsUploading] = useState(false);
  const [damagePhotoUrl, setDamagePhotoUrl] = useState<string | null>(null);
  
  const handleDamagePhotoUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!isDamaged) return null;
    
    setIsUploading(true);
    
    try {
      // In production, we would upload to a server here
      // For demo, create an object URL
      const photoUrl = URL.createObjectURL(file);
      
      // Update local state
      setDamagePhotoUrl(photoUrl);
      
      // Add to form data
      const currentPhotos = form.getValues('uploadedPhotos') || [];
      form.setValue('uploadedPhotos', [...currentPhotos, photoUrl], { shouldValidate: true });
      
      toast.success('Damage photo uploaded successfully');
      return photoUrl;
    } catch (error) {
      console.error('Error uploading damage photo:', error);
      toast.error('Failed to upload damage photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [isDamaged, form]);
  
  const handleRemoveDamagePhoto = useCallback(() => {
    // Remove from local state
    setDamagePhotoUrl(null);
    
    // Remove from form data
    const currentPhotos = form.getValues('uploadedPhotos') || [];
    if (damagePhotoUrl) {
      form.setValue(
        'uploadedPhotos', 
        currentPhotos.filter(url => url !== damagePhotoUrl),
        { shouldValidate: true }
      );
    }
    
    toast.success('Damage photo removed');
    return true;
  }, [damagePhotoUrl, form]);
  
  if (!isDamaged) {
    return null;
  }
  
  return (
    <FormSection title="Damage Photos" subtitle="Upload photos of any damage to your vehicle">
      <Alert variant="warning" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Since you indicated the vehicle has damage, please upload photos showing the damage clearly.
          This will help potential buyers understand the condition accurately.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PhotoUpload 
          id="damage_photo"
          title="Damage Photo"
          description="Clear photo of the damage"
          isUploading={isUploading}
          isRequired={true}
          currentImage={damagePhotoUrl || undefined}
          onUpload={handleDamagePhotoUpload}
          onRemove={handleRemoveDamagePhoto}
        />
      </div>
    </FormSection>
  );
};
