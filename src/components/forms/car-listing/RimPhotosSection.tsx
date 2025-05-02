
/**
 * Changes made:
 * - 2024-08-09: Created RimPhotosSection component for rim photo uploads
 * - 2024-09-15: Added state tracking for uploaded rims
 * - 2027-08-03: Improved error handling when carId is not available
 * - 2027-08-12: Updated PhotoUpload props to use title and description instead of label
 * - 2028-05-30: Fixed type issues with onUpload function return type
 * - 2025-04-03: Updated to use FormDataContext instead of requiring form prop
 * - 2025-05-02: Refactored to use temporary storage instead of direct uploads
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useFormData } from "./context/FormDataContext";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";
import { PhotoUpload } from "./photo-upload/PhotoUpload";
import { toast } from "sonner";

interface RimPhotosSectionProps {
  carId?: string;
}

export const RimPhotosSection = ({ carId }: RimPhotosSectionProps) => {
  const { form } = useFormData();
  
  const [uploadedRims, setUploadedRims] = useState({
    front_left: false,
    front_right: false,
    rear_left: false,
    rear_right: false
  });
  
  // Use our temporary file storage hooks for each rim position
  const frontLeft = useTemporaryFileUpload({ 
    category: 'rim_front_left',
    allowMultiple: false
  });
  
  const frontRight = useTemporaryFileUpload({ 
    category: 'rim_front_right',
    allowMultiple: false
  });
  
  const rearLeft = useTemporaryFileUpload({ 
    category: 'rim_rear_left',
    allowMultiple: false
  });
  
  const rearRight = useTemporaryFileUpload({ 
    category: 'rim_rear_right',
    allowMultiple: false
  });
  
  // Update form's rimPhotos field when files change
  useEffect(() => {
    const rimPhotos = {
      front_left: frontLeft.files[0]?.id || null,
      front_right: frontRight.files[0]?.id || null,
      rear_left: rearLeft.files[0]?.id || null,
      rear_right: rearRight.files[0]?.id || null
    };
    
    // Update uploadedRims state
    setUploadedRims({
      front_left: !!rimPhotos.front_left,
      front_right: !!rimPhotos.front_right,
      rear_left: !!rimPhotos.rear_left,
      rear_right: !!rimPhotos.rear_right
    });
    
    // Store in form data
    form.setValue('rimPhotos', rimPhotos, { shouldDirty: true });
    
    // Check if all rims are uploaded
    const allUploaded = Object.values(rimPhotos).every(Boolean);
    form.setValue('rimPhotosComplete', allUploaded, { shouldDirty: true });
    
  }, [frontLeft.files, frontRight.files, rearLeft.files, rearRight.files, form]);
  
  // Handle file upload for a specific rim position
  const handleRimPhotoUpload = async (file: File, position: string): Promise<string | null> => {
    let uploadHook;
    switch (position) {
      case 'front_left': 
        uploadHook = frontLeft;
        break;
      case 'front_right': 
        uploadHook = frontRight;
        break;
      case 'rear_left': 
        uploadHook = rearLeft;
        break;
      case 'rear_right': 
        uploadHook = rearRight;
        break;
      default:
        toast.error("Invalid rim position");
        return null;
    }
    
    const result = await uploadHook.uploadFile(file);
    if (result) {
      toast.success(`${position.replace('_', ' ')} rim photo added`);
      return result.preview;
    }
    
    return null;
  };

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-oswald font-bold mb-6 text-dark border-b pb-4">
        Rim Photos
      </h2>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please take clear photos of all four rims. These photos will be used to evaluate the condition of your wheels.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PhotoUpload
          id="rim_front_left"
          title="Front Left Rim"
          description="Clear photo of front left wheel"
          isUploading={frontLeft.isUploading}
          progress={frontLeft.progress}
          currentImage={frontLeft.files[0]?.preview}
          onUpload={(file) => handleRimPhotoUpload(file, 'front_left')}
          onRemove={frontLeft.files[0] ? () => frontLeft.removeFile(frontLeft.files[0].id) : undefined}
        />
        <PhotoUpload
          id="rim_front_right"
          title="Front Right Rim"
          description="Clear photo of front right wheel"
          isUploading={frontRight.isUploading}
          progress={frontRight.progress}
          currentImage={frontRight.files[0]?.preview}
          onUpload={(file) => handleRimPhotoUpload(file, 'front_right')}
          onRemove={frontRight.files[0] ? () => frontRight.removeFile(frontRight.files[0].id) : undefined}
        />
        <PhotoUpload
          id="rim_rear_left"
          title="Rear Left Rim"
          description="Clear photo of rear left wheel"
          isUploading={rearLeft.isUploading}
          progress={rearLeft.progress}
          currentImage={rearLeft.files[0]?.preview}
          onUpload={(file) => handleRimPhotoUpload(file, 'rear_left')}
          onRemove={rearLeft.files[0] ? () => rearLeft.removeFile(rearLeft.files[0].id) : undefined}
        />
        <PhotoUpload
          id="rim_rear_right"
          title="Rear Right Rim"
          description="Clear photo of rear right wheel"
          isUploading={rearRight.isUploading}
          progress={rearRight.progress}
          currentImage={rearRight.files[0]?.preview}
          onUpload={(file) => handleRimPhotoUpload(file, 'rear_right')}
          onRemove={rearRight.files[0] ? () => rearRight.removeFile(rearRight.files[0].id) : undefined}
        />
      </div>
    </Card>
  );
};
