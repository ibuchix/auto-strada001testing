
/**
 * Required Photos Component
 * Updated: 2025-05-30 - Phase 4: Updated to use new File object preservation
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePhotoUploadState } from './hooks/usePhotoUploadState';
import { usePhotoUploadHandlers } from './hooks/usePhotoUploadHandlers';
import { useFormContext } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

const REQUIRED_PHOTOS = [
  { key: 'frontView', label: 'Front View', description: 'Clear front view of the vehicle' },
  { key: 'rearView', label: 'Rear View', description: 'Clear rear view of the vehicle' },
  { key: 'driverSide', label: 'Driver Side', description: 'Left side of the vehicle' },
  { key: 'passengerSide', label: 'Passenger Side', description: 'Right side of the vehicle' },
  { key: 'dashboard', label: 'Dashboard', description: 'Interior dashboard view' },
  { key: 'interiorFront', label: 'Interior Front', description: 'Front seats and interior' },
  { key: 'interiorRear', label: 'Interior Rear', description: 'Rear seats and interior' },
] as const;

export const RequiredPhotos: React.FC = () => {
  const form = useFormContext<CarListingFormData>();
  const uploadState = usePhotoUploadState({ form });
  const handlers = usePhotoUploadHandlers({ form, uploadState });
  
  const { state, files } = uploadState;
  
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>, photoKey: string) => {
    const file = event.target.files?.[0];
    if (file) {
      const setterKey = `set${photoKey.charAt(0).toUpperCase() + photoKey.slice(1)}` as keyof typeof uploadState.setters;
      handlers.handleSinglePhotoUpload(file, setterKey);
    }
    // Reset input
    event.target.value = '';
  };
  
  const handleRemovePhoto = (photoKey: string) => {
    const setterKey = `set${photoKey.charAt(0).toUpperCase() + photoKey.slice(1)}` as keyof typeof uploadState.setters;
    handlers.removePhoto(setterKey);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Required Photos ({Object.values(files).filter(photoArray => photoArray.length > 0).length}/{REQUIRED_PHOTOS.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!state.allRequiredUploaded && (
          <Alert>
            <AlertDescription>
              Please upload all {REQUIRED_PHOTOS.length} required photos to continue with your listing.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REQUIRED_PHOTOS.map(({ key, label, description }) => {
            const photoFiles = files[key as keyof typeof files] as any[];
            const hasPhoto = photoFiles && photoFiles.length > 0;
            const photoFile = hasPhoto ? photoFiles[0] : null;
            
            return (
              <div key={key} className="border rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-medium text-sm">{label}</h4>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                
                {hasPhoto && photoFile ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={photoFile.preview}
                        alt={label}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => handleRemovePhoto(key)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-600">✓ Photo uploaded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileInput(e, key)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <span className="cursor-pointer">
                          Upload {label}
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {state.allRequiredUploaded && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✓ All required photos have been uploaded successfully!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
