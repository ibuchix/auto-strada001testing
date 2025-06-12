
/**
 * Photos Upload Section Component
 * Created: 2025-06-17
 * Updated: 2025-06-12 - Removed additional photos and rim photos (moved to separate sections)
 * 
 * Section focused only on required vehicle photos
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { useFormData } from "../context/FormDataContext";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";
import { RequiredPhotosGrid } from "../photo-upload/RequiredPhotosGrid";
import { adaptTemporaryFileUploader, updateVehiclePhotos } from "../utilities/photoHelpers";
import { DamagePhotosSection } from "./DamagePhotosSection";
import { SafeFormWrapper } from "../SafeFormWrapper";

export const PhotosSection = ({ carId }: { carId?: string }) => {
  const [allPhotosUploaded, setAllPhotosUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  return (
    <SafeFormWrapper>
      {(form) => {
        const isDamaged = form.watch("isDamaged");
        
        // Create temporary file uploaders for required photos only
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
          form
        ]);
        
        return (
          <div className="space-y-8">
            {/* Required Photos Section */}
            <Card>
              <CardHeader>
                <CardTitle>Required Vehicle Photos</CardTitle>
                <CardDescription>
                  Please upload all required photos of your vehicle. These photos are essential for the listing.
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
                      All required photos have been uploaded successfully.
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
                  odometer={adaptTemporaryFileUploader(odometer)}
                />
              </CardContent>
            </Card>
            
            {/* Damage Photos Section - only shown if vehicle is damaged */}
            {isDamaged && <DamagePhotosSection />}
          </div>
        );
      }}
    </SafeFormWrapper>
  );
};
