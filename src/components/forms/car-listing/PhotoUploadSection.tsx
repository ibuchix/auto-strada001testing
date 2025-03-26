
/**
 * Changes made:
 * - 2025-06-15: Removed diagnosticId prop
 */

import { useState } from 'react';
import { usePhotoUpload } from './photo-upload/usePhotoUpload';
import { PhotoUploadSectionProps } from './photo-upload/types';
import { RequiredPhotos } from './photo-upload/RequiredPhotos';
import { AdditionalPhotos } from './photo-upload/AdditionalPhotos';
import { FormSectionHeader } from './FormSectionHeader';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormSection } from './FormSection';
import { SaveButton } from './SaveButton';

export const PhotoUploadSection = ({ form, carId }: PhotoUploadSectionProps) => {
  const [progress, setProgress] = useState(0);
  const { 
    isUploading, 
    uploadedPhotos, 
    uploadFile,
    setUploadedPhotos
  } = usePhotoUpload({ 
    carId, 
    category: 'required_photos',
    onProgressUpdate: setProgress
  });

  const handleFileSelect = async (file: File, type: string) => {
    if (!carId) {
      return null;
    }
    
    // Upload the file
    const photoUrl = await uploadFile(file, `${carId}/${type}`);
    
    if (photoUrl) {
      // Update the form with the photo URL
      const updatedRequiredPhotos = {
        ...form.getValues('requiredPhotos'),
        [type]: photoUrl
      };
      
      form.setValue('requiredPhotos', updatedRequiredPhotos, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
    
    return photoUrl;
  };
  
  const handleAdditionalPhotos = async (files: File[]) => {
    if (!carId) return;
    
    // Process each file
    for (const file of files) {
      const photoUrl = await uploadFile(file, `${carId}/additional`);
      
      if (photoUrl) {
        // Update form with additional photo
        const currentPhotos = form.getValues('uploadedPhotos') || [];
        form.setValue('uploadedPhotos', [...currentPhotos, photoUrl], {
          shouldValidate: true,
          shouldDirty: true
        });
        
        // Also update local state
        setUploadedPhotos(prev => [...prev, photoUrl]);
      }
    }
  };

  return (
    <FormSection>
      <FormSectionHeader 
        title="Vehicle Photos" 
        description="Upload clear photos of your vehicle to attract potential buyers" 
      />
      
      <div className="mt-6">
        <Tabs defaultValue="required" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="required">Required Photos</TabsTrigger>
            <TabsTrigger value="additional">Additional Photos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="required" className="pt-4 pb-2">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please upload all required photos of your vehicle. Clear, well-lit photos help your listing attract more interest.
              </p>
              
              <RequiredPhotos
                isUploading={isUploading}
                onFileSelect={handleFileSelect}
                progress={progress}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="additional" className="pt-4 pb-2">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload additional photos to showcase specific features or details of your vehicle.
              </p>
              
              <AdditionalPhotos
                form={form}
                isUploading={isUploading}
                onPhotosSelected={handleAdditionalPhotos}
                progress={progress}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-4">
        <SaveButton carId={carId} />
      </div>
    </FormSection>
  );
};
