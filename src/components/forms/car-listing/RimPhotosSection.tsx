
/**
 * Component for uploading rim photos
 * Created: 2025-07-18
 * Updated: 2025-07-24 - Added form context safety handling and error recovery
 * Updated: 2025-08-18 - Fixed car ID error by using temporary file storage
 * Updated: 2025-08-18 - Improved design consistency with main photo upload section
 */
import React, { useState, useEffect } from 'react';
import { Camera, UploadCloud, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeFormWrapper } from './SafeFormWrapper';
import { useFormData } from './context/FormDataContext';
import { useTemporaryFileUpload } from '@/hooks/useTemporaryFileUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export const RimPhotosSection = () => {
  // Use temporary file upload hooks for each rim position
  const frontLeftUploader = useTemporaryFileUpload({
    category: 'rim_front_left',
    allowMultiple: false
  });
  
  const frontRightUploader = useTemporaryFileUpload({
    category: 'rim_front_right',
    allowMultiple: false
  });
  
  const rearLeftUploader = useTemporaryFileUpload({
    category: 'rim_rear_left',
    allowMultiple: false
  });
  
  const rearRightUploader = useTemporaryFileUpload({
    category: 'rim_rear_right',
    allowMultiple: false
  });
  
  // Use our safe form context to ensure we have access to form methods
  return (
    <SafeFormWrapper
      fallback={
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Rim Photos (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
              Loading rim photos section...
            </div>
          </CardContent>
        </Card>
      }
    >
      {(form) => {
        const carId = form.watch('id');
        
        // Function to update form when photos are uploaded or removed
        const updateFormPhotos = () => {
          const rimPhotos = {
            rim_front_left: frontLeftUploader.files[0]?.preview || '',
            rim_front_right: frontRightUploader.files[0]?.preview || '',
            rim_rear_left: rearLeftUploader.files[0]?.preview || '',
            rim_rear_right: rearRightUploader.files[0]?.preview || '',
          };
          
          // Update form values for rim photos
          form.setValue('rim_photos', rimPhotos, { shouldDirty: true });
          
          // Also update required_photos object if it exists
          const requiredPhotos = form.getValues('required_photos') || {};
          form.setValue('required_photos', {
            ...requiredPhotos,
            ...Object.entries(rimPhotos).reduce((acc, [key, value]) => {
              if (value) acc[key] = value;
              return acc;
            }, {})
          }, { shouldDirty: true });
        };
        
        // Update form when any uploader's files change
        useEffect(() => {
          updateFormPhotos();
        }, [
          frontLeftUploader.files,
          frontRightUploader.files,
          rearLeftUploader.files,
          rearRightUploader.files
        ]);
        
        // Handle file upload with error handling
        const handleFileSelect = (file: File, position: string) => {
          let uploader;
          switch (position) {
            case 'front_left': uploader = frontLeftUploader; break;
            case 'front_right': uploader = frontRightUploader; break;
            case 'rear_left': uploader = rearLeftUploader; break;
            case 'rear_right': uploader = rearRightUploader; break;
            default: return;
          }
          
          try {
            uploader.uploadFile(file).then((result) => {
              if (result) {
                toast.success(`${position.replace('_', ' ')} rim photo uploaded`);
                updateFormPhotos();
              }
            });
          } catch (error) {
            console.error(`Error uploading rim photo for ${position}:`, error);
            toast.error('Failed to upload rim photo');
          }
        };

        return (
          <Card className="mb-6">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-lg font-medium">Rim Photos (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Alert className="mb-4 bg-gray-50 border border-gray-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Upload clear photos of all four rims to help buyers assess their condition.
                  These photos will help dealers accurately value your vehicle.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { position: 'front_left', title: 'Front Left', uploader: frontLeftUploader },
                  { position: 'front_right', title: 'Front Right', uploader: frontRightUploader },
                  { position: 'rear_left', title: 'Rear Left', uploader: rearLeftUploader },
                  { position: 'rear_right', title: 'Rear Right', uploader: rearRightUploader }
                ].map(({ position, title, uploader }) => (
                  <div key={position} className="flex flex-col">
                    <p className="mb-2 text-sm font-medium">{title}</p>
                    
                    <Card className="aspect-square overflow-hidden relative group">
                      {uploader.files.length > 0 ? (
                        <>
                          <img 
                            src={uploader.files[0].preview} 
                            alt={`${title} rim`} 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              uploader.removeFile(uploader.files[0].id);
                              toast.info(`${title} rim photo removed`);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gray-50">
                          {uploader.isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                              <span className="text-sm text-gray-500">Uploading...</span>
                              {uploader.progress > 0 && (
                                <Progress value={uploader.progress} className="w-full h-1" />
                              )}
                            </div>
                          ) : (
                            <>
                              <Camera className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500">Upload {title} rim photo</p>
                            </>
                          )}
                        </div>
                      )}
                      
                      {!uploader.isUploading && (
                        <input 
                          type="file"
                          id={`rim-${position}`}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelect(e.target.files[0], position);
                              e.target.value = '';
                            }
                          }}
                        />
                      )}
                    </Card>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      disabled={uploader.isUploading}
                      asChild
                    >
                      <label htmlFor={`rim-${position}`} className="flex items-center justify-center gap-2 cursor-pointer">
                        <UploadCloud className="h-4 w-4" />
                        {uploader.files.length > 0 ? 'Change' : 'Upload'}
                      </label>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      }}
    </SafeFormWrapper>
  );
};
