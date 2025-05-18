
/**
 * Component for uploading rim photos
 * Created: 2025-07-18
 */
import React, { useState } from 'react';
import { Camera, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFormContext } from 'react-hook-form';
import { uploadPhoto } from './photo-upload/services/photoStorageService';

export const RimPhotosSection = () => {
  const [uploadingRim, setUploadingRim] = useState<string | null>(null);
  const form = useFormContext();
  const [rimPhotos, setRimPhotos] = useState<Record<string, string>>({
    rim_front_left: '',
    rim_front_right: '',
    rim_rear_left: '',
    rim_rear_right: '',
  });
  
  // Get car ID from form
  const carId = form.watch('id');
  
  const handleUploadRimPhoto = async (file: File, position: string) => {
    if (!carId) {
      console.error('Car ID is required for rim photo upload');
      return;
    }
    
    try {
      setUploadingRim(position);
      
      // Upload using the photoStorageService
      const photoUrl = await uploadPhoto(file, carId, `rim_${position}`);
      
      if (photoUrl) {
        // Update local state
        setRimPhotos(prev => ({
          ...prev,
          [`rim_${position}`]: photoUrl
        }));
        
        // Update form values
        const requiredPhotos = form.getValues('required_photos') || {};
        form.setValue('required_photos', {
          ...requiredPhotos,
          [`rim_${position}`]: photoUrl
        }, { shouldDirty: true });
      }
    } catch (error) {
      console.error(`Error uploading rim photo for ${position}:`, error);
    } finally {
      setUploadingRim(null);
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Rim Photos (Optional)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {['front_left', 'front_right', 'rear_left', 'rear_right'].map((position) => (
            <div key={position} className="flex flex-col items-center">
              <p className="mb-2 text-sm font-medium capitalize">{position.replace('_', ' ')}</p>
              
              <Card className="w-full aspect-square overflow-hidden relative">
                {rimPhotos[`rim_${position}`] ? (
                  <img 
                    src={rimPhotos[`rim_${position}`]} 
                    alt={`${position} rim`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                    {uploadingRim === position ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-600">Upload rim photo</p>
                      </>
                    )}
                  </div>
                )}
                
                {!uploadingRim && (
                  <input 
                    type="file"
                    id={`rim-${position}`}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadRimPhoto(e.target.files[0], position);
                        e.target.value = '';
                      }
                    }}
                  />
                )}
              </Card>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                disabled={!!uploadingRim}
                asChild
              >
                <label htmlFor={`rim-${position}`} className="flex items-center gap-2 cursor-pointer">
                  <UploadCloud className="h-4 w-4" />
                  {rimPhotos[`rim_${position}`] ? 'Replace' : 'Upload'}
                </label>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
