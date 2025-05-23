
/**
 * Photos Upload Section Component
 * Created: 2025-06-17
 * Updated: 2025-06-18 - Fixed type errors with temporary file storage
 * Updated: 2025-05-04 - Added RimPhotosSection to the photo upload form
 * Updated: 2025-08-27 - Improved error handling and consistent design
 * Updated: 2025-08-27 - Fixed missing uploads array error
 * Updated: 2025-08-28 - Fixed type compatibility with PhotoUploaderProps
 * Updated: 2025-05-21 - Fixed adaptTemporaryFileUploader function to include uploadFiles property
 * Updated: 2025-05-20 - Added odometer photo uploader to match required fields in photoMapping.ts
 * Updated: 2025-05-27 - Fixed field naming to use camelCase consistently
 * Updated: 2025-05-28 - Fixed field references for requiredPhotosComplete
 * Updated: 2025-05-30 - Updated to use consistent API for photo helper functions
 * Updated: 2025-06-24 - Fixed photo field mapping to handle both camelCase and snake_case formats
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, Camera } from "lucide-react";
import { useFormData } from "../context/FormDataContext";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";
import { RequiredPhotosGrid } from "../photo-upload/RequiredPhotosGrid";
import { adaptTemporaryFileUploader, updateVehiclePhotos } from "../utilities/photoHelpers";
import { RimPhotosSection } from "../RimPhotosSection";
import { DamagePhotosSection } from "./DamagePhotosSection";
import { SafeFormWrapper } from "../SafeFormWrapper";
import { REQUIRED_PHOTO_FIELDS, standardizePhotoCategory } from "@/utils/photoMapping";

export const PhotosSection = ({ carId }: { carId?: string }) => {
  const [allPhotosUploaded, setAllPhotosUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Use the SafeFormWrapper to handle potential form context issues
  return (
    <SafeFormWrapper>
      {(form) => {
        const isDamaged = form.watch("isDamaged");
        
        // Create a separate temporary file uploader for each photo type
        const frontView = useTemporaryFileUpload({
          category: 'front_view',
          allowMultiple: false,
          maxFiles: 1
        });
        
        const rearView = useTemporaryFileUpload({
          category: 'rear_view',
          allowMultiple: false,
          maxFiles: 1
        });
        
        const driverSide = useTemporaryFileUpload({
          category: 'driver_side',
          allowMultiple: false,
          maxFiles: 1
        });
        
        const passengerSide = useTemporaryFileUpload({
          category: 'passenger_side',
          allowMultiple: false,
          maxFiles: 1
        });
        
        const dashboard = useTemporaryFileUpload({
          category: 'dashboard',
          allowMultiple: false,
          maxFiles: 1
        });
        
        const interiorFront = useTemporaryFileUpload({
          category: 'interior_front',
          allowMultiple: false,
          maxFiles: 1
        });
        
        const interiorRear = useTemporaryFileUpload({
          category: 'interior_rear',
          allowMultiple: false,
          maxFiles: 1
        });
        
        const odometer = useTemporaryFileUpload({
          category: 'odometer',
          allowMultiple: false,
          maxFiles: 1
        });
        
        // For additional photos
        const additionalPhotos = useTemporaryFileUpload({
          category: 'additional_photos',
          allowMultiple: true,
          maxFiles: 10
        });
        
        // Update form data when files change
        useEffect(() => {
          try {
            // Build an object with the vehicle photos
            const vehiclePhotoUpdates = {
              frontView: frontView.files.length > 0 ? frontView.files[0].preview || '' : undefined,
              rearView: rearView.files.length > 0 ? rearView.files[0].preview || '' : undefined,
              driverSide: driverSide.files.length > 0 ? driverSide.files[0].preview || '' : undefined,
              passengerSide: passengerSide.files.length > 0 ? passengerSide.files[0].preview || '' : undefined,
              dashboard: dashboard.files.length > 0 ? dashboard.files[0].preview || '' : undefined,
              interiorFront: interiorFront.files.length > 0 ? interiorFront.files[0].preview || '' : undefined,
              interiorRear: interiorRear.files.length > 0 ? interiorRear.files[0].preview || '' : undefined,
              odometer: odometer.files.length > 0 ? odometer.files[0].preview || '' : undefined,
            };
            
            // Update both camelCase and snake_case fields
            updateVehiclePhotos(form, vehiclePhotoUpdates).then((allUploaded) => {
              setAllPhotosUploaded(!!allUploaded);
              form.setValue('requiredPhotosComplete', !!allUploaded, { shouldDirty: true });
              
              // Also set individual direct fields for legacy compatibility
              if (frontView.files.length > 0) 
                form.setValue("frontView", frontView.files[0].preview || '');
              if (rearView.files.length > 0) 
                form.setValue("rearView", rearView.files[0].preview || '');
              if (driverSide.files.length > 0) 
                form.setValue("driverSide", driverSide.files[0].preview || '');
              if (passengerSide.files.length > 0) 
                form.setValue("passengerSide", passengerSide.files[0].preview || '');
              if (dashboard.files.length > 0) 
                form.setValue("dashboard", dashboard.files[0].preview || '');
              if (interiorFront.files.length > 0) 
                form.setValue("interiorFront", interiorFront.files[0].preview || '');
              if (interiorRear.files.length > 0) 
                form.setValue("interiorRear", interiorRear.files[0].preview || '');
              if (odometer.files.length > 0) 
                form.setValue("odometer", odometer.files[0].preview || '');
            });
            
            // Add any additional photos to uploadedPhotos array
            if (additionalPhotos.files.length > 0) {
              form.setValue("uploadedPhotos", additionalPhotos.files.map(f => f.preview || ''));
            }
            
          } catch (error) {
            console.error("Error updating form with photos:", error);
            setUploadError("Failed to update form with photos");
          }
        }, [
          frontView.files,
          rearView.files,
          driverSide.files,
          passengerSide.files,
          dashboard.files,
          interiorFront.files,
          interiorRear.files,
          odometer.files,
          additionalPhotos.files,
          form
        ]);
        
        // Log validation state when photos change
        useEffect(() => {
          console.log("Photo validation state:", {
            frontView: !!frontView.files.length, 
            rearView: !!rearView.files.length,
            driverSide: !!driverSide.files.length,
            passengerSide: !!passengerSide.files.length,
            dashboard: !!dashboard.files.length,
            interiorFront: !!interiorFront.files.length,
            interiorRear: !!interiorRear.files.length,
            odometer: !!odometer.files.length,
            allPhotosUploaded
          });
        }, [
          frontView.files,
          rearView.files,
          driverSide.files,
          passengerSide.files,
          dashboard.files,
          interiorFront.files,
          interiorRear.files,
          odometer.files,
          allPhotosUploaded
        ]);
        
        return (
          <div className="space-y-8">
            {/* Required Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Photos</CardTitle>
                <CardDescription>
                  Please upload the following required photos of your vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                ) : allPhotosUploaded ? (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      All required photos have been uploaded. You can add additional photos below.
                    </AlertDescription>
                  </Alert>
                ) : null}
                
                <RequiredPhotosGrid
                  frontView={adaptTemporaryFileUploader(frontView)}
                  rearView={adaptTemporaryFileUploader(rearView)}
                  driverSide={adaptTemporaryFileUploader(driverSide)}
                  passengerSide={adaptTemporaryFileUploader(passengerSide)}
                  dashboard={adaptTemporaryFileUploader(dashboard)}
                  interiorFront={adaptTemporaryFileUploader(interiorFront)}
                  interiorRear={adaptTemporaryFileUploader(interiorRear)}
                  odometer={adaptTemporaryFileUploader(odometer)} // Added odometer to grid props
                />
              </CardContent>
            </Card>
            
            {/* Additional Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Photos</CardTitle>
                <CardDescription>
                  Upload any additional photos of your vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {additionalPhotos.files.map((file) => (
                    <div key={file.id} className="aspect-square rounded-md overflow-hidden border">
                      <img 
                        src={file.preview} 
                        alt="Additional photo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  
                  {additionalPhotos.files.length < 10 && (
                    <label
                      htmlFor="additional-photos"
                      className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Add Photo</span>
                      <input 
                        type="file"
                        id="additional-photos"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files && additionalPhotos.uploadFiles(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Rim Photos Section */}
            <RimPhotosSection />
            
            {/* Damage Photos Section - only shown if vehicle is damaged */}
            {isDamaged && <DamagePhotosSection />}
          </div>
        );
      }}
    </SafeFormWrapper>
  );
};
