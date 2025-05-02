
/**
 * Component for uploading photos to a car listing
 * Changes made:
 * - 2025-04-05: Refactored into smaller components for better maintainability
 * - 2025-04-05: Extracted AlertMessage component, usePhotoUploadSection hook
 * - 2025-04-05: Enhanced structure and separation of concerns
 * - 2025-05-02: Updated to use temporary storage instead of uploading to database
 * - 2025-05-02: Photos will be stored in memory until form submission
 */
import React from 'react';
import { useFormData } from './context/FormDataContext';
import { FormSection } from './FormSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useTemporaryFileUpload } from '@/hooks/useTemporaryFileUpload';
import { RequiredPhotosGrid } from './photo-upload/RequiredPhotosGrid';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  carId?: string;
  onValidate?: () => Promise<boolean>;
}

export const PhotoUploadSection = ({ 
  carId, 
  onValidate 
}: PhotoUploadProps) => {
  const { form } = useFormData();
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [validated, setValidated] = React.useState(false);
  
  // Get photo upload state from the hook for each required photo
  const frontView = useTemporaryFileUpload({
    category: 'required_front_view',
    allowMultiple: false
  });
  
  const rearView = useTemporaryFileUpload({
    category: 'required_rear_view',
    allowMultiple: false
  });
  
  const driverSide = useTemporaryFileUpload({
    category: 'required_driver_side',
    allowMultiple: false
  });
  
  const passengerSide = useTemporaryFileUpload({
    category: 'required_passenger_side',
    allowMultiple: false
  });
  
  const dashboard = useTemporaryFileUpload({
    category: 'required_dashboard',
    allowMultiple: false
  });
  
  const interiorFront = useTemporaryFileUpload({
    category: 'required_interior_front',
    allowMultiple: false
  });
  
  const interiorRear = useTemporaryFileUpload({
    category: 'required_interior_rear',
    allowMultiple: false
  });
  
  const additionalPhotos = useTemporaryFileUpload({
    category: 'additional_photos',
    allowMultiple: true,
    maxFiles: 10
  });
  
  // Check if all required photos are uploaded
  const allRequiredUploaded = React.useMemo(() => {
    return frontView.files.length > 0 &&
      rearView.files.length > 0 &&
      driverSide.files.length > 0 &&
      passengerSide.files.length > 0 &&
      dashboard.files.length > 0 &&
      interiorFront.files.length > 0 &&
      interiorRear.files.length > 0;
  }, [
    frontView.files, 
    rearView.files, 
    driverSide.files, 
    passengerSide.files, 
    dashboard.files, 
    interiorFront.files, 
    interiorRear.files
  ]);

  // Validate photos section
  React.useEffect(() => {
    // Update form value
    form.setValue('requiredPhotosComplete', allRequiredUploaded, { shouldDirty: true });
    
    // Collect all photo ids for form submission
    const photoIds = {
      frontView: frontView.files[0]?.id,
      rearView: rearView.files[0]?.id,
      driverSide: driverSide.files[0]?.id,
      passengerSide: passengerSide.files[0]?.id,
      dashboard: dashboard.files[0]?.id,
      interiorFront: interiorFront.files[0]?.id,
      interiorRear: interiorRear.files[0]?.id,
      additionalPhotos: additionalPhotos.files.map(file => file.id)
    };
    
    form.setValue('photoIds', photoIds, { shouldDirty: true });
    
    if (allRequiredUploaded) {
      setValidationError(null);
      setValidated(true);
    } else {
      setValidated(false);
    }
  }, [
    allRequiredUploaded, 
    form, 
    frontView.files, 
    rearView.files, 
    driverSide.files, 
    passengerSide.files,
    dashboard.files,
    interiorFront.files,
    interiorRear.files,
    additionalPhotos.files
  ]);

  // Get session timer
  const sessionTimeRemaining = frontView.remainingSessionTime;

  return (
    <FormSection 
      title="Vehicle Photos"
      subtitle="Upload photos of your vehicle"
    >
      {/* Session timer */}
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Session time remaining: {sessionTimeRemaining} minutes. Please complete the form within this time.
        </AlertDescription>
      </Alert>
      
      {/* Error Alert */}
      {validationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      {/* Required photos instruction */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Photos will be stored locally and uploaded when you submit the form. You must upload all 7 required photos to proceed.
        </AlertDescription>
      </Alert>

      <div className="space-y-8 mb-8">
        <RequiredPhotosGrid
          frontView={{
            files: frontView.files,
            isUploading: frontView.isUploading,
            progress: frontView.progress,
            uploadFiles: frontView.uploadFiles,
            removeFile: frontView.removeFile
          }}
          rearView={{
            files: rearView.files,
            isUploading: rearView.isUploading,
            progress: rearView.progress,
            uploadFiles: rearView.uploadFiles,
            removeFile: rearView.removeFile
          }}
          driverSide={{
            files: driverSide.files,
            isUploading: driverSide.isUploading,
            progress: driverSide.progress,
            uploadFiles: driverSide.uploadFiles,
            removeFile: driverSide.removeFile
          }}
          passengerSide={{
            files: passengerSide.files,
            isUploading: passengerSide.isUploading,
            progress: passengerSide.progress,
            uploadFiles: passengerSide.uploadFiles,
            removeFile: passengerSide.removeFile
          }}
          dashboard={{
            files: dashboard.files,
            isUploading: dashboard.isUploading,
            progress: dashboard.progress,
            uploadFiles: dashboard.uploadFiles,
            removeFile: dashboard.removeFile
          }}
          interiorFront={{
            files: interiorFront.files,
            isUploading: interiorFront.isUploading,
            progress: interiorFront.progress,
            uploadFiles: interiorFront.uploadFiles,
            removeFile: interiorFront.removeFile
          }}
          interiorRear={{
            files: interiorRear.files,
            isUploading: interiorRear.isUploading,
            progress: interiorRear.progress,
            uploadFiles: interiorRear.uploadFiles,
            removeFile: interiorRear.removeFile
          }}
        />
      </div>
      
      {/* Additional photos section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-3">Additional Photos (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You can upload up to 10 additional photos to showcase your vehicle.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Gallery</h4>
            <input 
              type="file" 
              id="additional-photos-upload" 
              multiple 
              accept="image/*" 
              className="hidden"
              onChange={(e) => e.target.files && additionalPhotos.uploadFiles(e.target.files)}
            />
            <label htmlFor="additional-photos-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={additionalPhotos.isUploading || additionalPhotos.files.length >= 10}
                className="cursor-pointer"
                asChild
              >
                <span>Add Photos</span>
              </Button>
            </label>
          </div>
          
          {additionalPhotos.isUploading && (
            <div className="w-full">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${additionalPhotos.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {additionalPhotos.files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {additionalPhotos.files.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square rounded-md overflow-hidden border bg-gray-100">
                    <img 
                      src={file.preview} 
                      alt="Additional photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => additionalPhotos.removeFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
};
