
/**
 * Photos Upload Section Component
 * Created: 2025-06-17
 * 
 * This component handles the upload of all required vehicle photos
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, Camera } from "lucide-react";
import { useFormData } from "../context/FormDataContext";
import { useTemporaryFileUpload } from "@/hooks/useTemporaryFileUpload";
import { RequiredPhotosGrid } from "../photo-upload/RequiredPhotosGrid";
import { PhotoSection } from "../photo-upload/components/PhotoSection";

export const PhotosSection = ({ carId }: { carId?: string }) => {
  const { form } = useFormData();
  const [allPhotosUploaded, setAllPhotosUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
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
  
  // For additional photos
  const additionalPhotos = useTemporaryFileUpload({
    category: 'additional_photos',
    allowMultiple: true,
    maxFiles: 10
  });
  
  // Update form data when files change
  useEffect(() => {
    // Update form values with current photo files
    const vehiclePhotos = {
      frontView: frontView.files.length > 0 ? frontView.files[0].preview : undefined,
      rearView: rearView.files.length > 0 ? rearView.files[0].preview : undefined,
      driverSide: driverSide.files.length > 0 ? driverSide.files[0].preview : undefined,
      passengerSide: passengerSide.files.length > 0 ? passengerSide.files[0].preview : undefined,
      dashboard: dashboard.files.length > 0 ? dashboard.files[0].preview : undefined,
      interiorFront: interiorFront.files.length > 0 ? interiorFront.files[0].preview : undefined,
      interiorRear: interiorRear.files.length > 0 ? interiorRear.files[0].preview : undefined,
    };
    
    form.setValue("vehiclePhotos", vehiclePhotos, { shouldDirty: true });
    
    // Also set individual fields for compatibility
    if (frontView.files.length > 0) form.setValue("frontView", frontView.files[0].preview);
    if (rearView.files.length > 0) form.setValue("rearView", rearView.files[0].preview);
    if (driverSide.files.length > 0) form.setValue("driverSide", driverSide.files[0].preview);
    if (passengerSide.files.length > 0) form.setValue("passengerSide", passengerSide.files[0].preview);
    if (dashboard.files.length > 0) form.setValue("dashboard", dashboard.files[0].preview);
    if (interiorFront.files.length > 0) form.setValue("interiorFront", interiorFront.files[0].preview);
    if (interiorRear.files.length > 0) form.setValue("interiorRear", interiorRear.files[0].preview);
    
    // Add any additional photos to uploadedPhotos array
    if (additionalPhotos.files.length > 0) {
      form.setValue("uploadedPhotos", additionalPhotos.files.map(f => f.preview));
    }
    
    // Check if all required photos are uploaded
    const requiredUploaded = 
      frontView.files.length > 0 && 
      rearView.files.length > 0 && 
      driverSide.files.length > 0 && 
      passengerSide.files.length > 0 && 
      dashboard.files.length > 0 && 
      interiorFront.files.length > 0;
    
    form.setValue("requiredPhotosComplete", requiredUploaded);
    setAllPhotosUploaded(requiredUploaded);
  }, [
    frontView.files, 
    rearView.files, 
    driverSide.files, 
    passengerSide.files, 
    dashboard.files, 
    interiorFront.files, 
    interiorRear.files, 
    additionalPhotos.files,
    form
  ]);
  
  const requiredPhotoItems = [
    { 
      id: 'front-view', 
      title: 'Front View', 
      description: 'Clear photo of the front of the vehicle', 
      required: true 
    },
    { 
      id: 'rear-view', 
      title: 'Rear View', 
      description: 'Clear photo of the back of the vehicle', 
      required: true 
    },
    { 
      id: 'driver-side', 
      title: 'Driver Side', 
      description: 'Side view of the vehicle (driver\'s side)', 
      required: true 
    },
    { 
      id: 'passenger-side', 
      title: 'Passenger Side', 
      description: 'Side view of the vehicle (passenger\'s side)', 
      required: true 
    },
    { 
      id: 'dashboard', 
      title: 'Dashboard', 
      description: 'Clear photo of the dashboard', 
      required: true 
    },
    { 
      id: 'interior-front', 
      title: 'Interior (Front)', 
      description: 'Photo of the front seats and interior', 
      required: true 
    },
    { 
      id: 'interior-rear', 
      title: 'Interior (Rear)', 
      description: 'Photo of the back seats and rear interior', 
      required: false 
    },
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Vehicle Photos</CardTitle>
        <CardDescription>
          Upload clear photos of your vehicle from different angles. 
          The first 6 photos are required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status section */}
        {allPhotosUploaded ? (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              All required photos have been uploaded.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please upload photos for each required view of your vehicle.
            </AlertDescription>
          </Alert>
        )}
        
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        
        {/* Photo grid */}
        <div className="space-y-8">
          <PhotoSection
            title="Required Vehicle Photos"
            description="Please upload clear photos of your vehicle from all required angles"
            icon={Camera}
            photos={requiredPhotoItems}
            uploadedPhotos={{
              'front-view': frontView.files.length > 0,
              'rear-view': rearView.files.length > 0,
              'driver-side': driverSide.files.length > 0,
              'passenger-side': passengerSide.files.length > 0,
              'dashboard': dashboard.files.length > 0,
              'interior-front': interiorFront.files.length > 0,
              'interior-rear': interiorRear.files.length > 0
            }}
            activeUploads={{
              'front-view': frontView.isUploading,
              'rear-view': rearView.isUploading,
              'driver-side': driverSide.isUploading,
              'passenger-side': passengerSide.isUploading,
              'dashboard': dashboard.isUploading,
              'interior-front': interiorFront.isUploading,
              'interior-rear': interiorRear.isUploading
            }}
            progress={0}
            onFileSelect={(file, type) => {
              setUploadError(null);
              try {
                switch(type) {
                  case 'front-view':
                    return frontView.uploadFile(file).then(result => result ? result.preview : null);
                  case 'rear-view':
                    return rearView.uploadFile(file).then(result => result ? result.preview : null);
                  case 'driver-side':
                    return driverSide.uploadFile(file).then(result => result ? result.preview : null);
                  case 'passenger-side':
                    return passengerSide.uploadFile(file).then(result => result ? result.preview : null);
                  case 'dashboard':
                    return dashboard.uploadFile(file).then(result => result ? result.preview : null);
                  case 'interior-front':
                    return interiorFront.uploadFile(file).then(result => result ? result.preview : null);
                  case 'interior-rear':
                    return interiorRear.uploadFile(file).then(result => result ? result.preview : null);
                  default:
                    return Promise.resolve(null);
                }
              } catch (error: any) {
                setUploadError(error.message || "Failed to upload photo");
                return Promise.resolve(null);
              }
            }}
            onPhotoUploaded={(type) => {
              console.log(`Photo uploaded: ${type}`);
            }}
            onUploadError={(type, error) => {
              setUploadError(`Error uploading ${type}: ${error}`);
            }}
            onUploadRetry={(type) => {
              setUploadError(null);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
