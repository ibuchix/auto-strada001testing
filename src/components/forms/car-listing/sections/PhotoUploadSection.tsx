
/**
 * Component for uploading photos to a car listing
 * Created: 2025-05-12
 * Purpose: Handles photo upload for car listings
 */

import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { FormSection, FormLabel } from '../FormSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, X, Upload } from 'lucide-react';
import { useTemporaryFileUpload } from '@/hooks/useTemporaryFileUpload';
import { RequiredPhotosGrid } from '../photo-upload/RequiredPhotosGrid';
import { Button } from '@/components/ui/button';
import { setPhotoField, updateVehiclePhotos } from '../utilities/photoHelpers';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PhotoUploadProps {
  carId?: string;
  onValidate?: () => Promise<boolean>;
}

// Adapter function to convert between types safely
const adaptFileUploader = (uploader: ReturnType<typeof useTemporaryFileUpload>) => {
  return {
    files: uploader.files,
    isUploading: uploader.isUploading,
    progress: uploader.progress,
    uploadFiles: uploader.uploadFiles,
    removeFile: uploader.removeFile
  };
};

export const PhotoUploadSection = ({ 
  carId, 
  onValidate 
}: PhotoUploadProps) => {
  const { form } = useFormData();
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [validated, setValidated] = React.useState(false);
  const [uploadedPhotos, setUploadedPhotos] = React.useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  
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
  
  // Handle file upload
  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        
        // Add uploaded photos
        const urls = fileArray.map(() => URL.createObjectURL(new Blob()));
        setUploadedPhotos(prev => [...prev, ...urls]);
        setSelectedFiles([]);
      }
    }, 300);
  };
  
  // Remove a photo
  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Validate photos section
  React.useEffect(() => {
    // Update form value using helper function for type safety
    form.setValue('requiredPhotosComplete', allRequiredUploaded, { shouldDirty: true });
    
    // Collect all URLs for form submission - ensure these are strings, not objects
    const photoArray: string[] = [
      ...(frontView.files.length > 0 ? [(frontView.files[0].preview || '')] : []),
      ...(rearView.files.length > 0 ? [(rearView.files[0].preview || '')] : []),
      ...(driverSide.files.length > 0 ? [(driverSide.files[0].preview || '')] : []),
      ...(passengerSide.files.length > 0 ? [(passengerSide.files[0].preview || '')] : []),
      ...(dashboard.files.length > 0 ? [(dashboard.files[0].preview || '')] : []),
      ...(interiorFront.files.length > 0 ? [(interiorFront.files[0].preview || '')] : []),
      ...(interiorRear.files.length > 0 ? [(interiorRear.files[0].preview || '')] : []),
      ...(additionalPhotos.files.map(f => f.preview || ''))
    ];
    
    // Update form with photo array - ensure these are all strings
    form.setValue('uploadedPhotos', photoArray, { shouldDirty: true });
    
    // Update individual photo fields with string values only
    if (frontView.files.length > 0) {
      setPhotoField('frontView', frontView.files[0].preview || '', form.setValue);
    }
    if (rearView.files.length > 0) {
      setPhotoField('rearView', rearView.files[0].preview || '', form.setValue);
    }
    if (driverSide.files.length > 0) {
      setPhotoField('driverSide', driverSide.files[0].preview || '', form.setValue);
    }
    if (passengerSide.files.length > 0) {
      setPhotoField('passengerSide', passengerSide.files[0].preview || '', form.setValue);
    }
    if (dashboard.files.length > 0) {
      setPhotoField('dashboard', dashboard.files[0].preview || '', form.setValue);
    }
    if (interiorFront.files.length > 0) {
      setPhotoField('interiorFront', interiorFront.files[0].preview || '', form.setValue);
    }
    if (interiorRear.files.length > 0) {
      setPhotoField('interiorRear', interiorRear.files[0].preview || '', form.setValue);
    }
    
    // Update vehicle photos object
    updateVehiclePhotos(form.setValue, form.getValues);
    
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
  
  return (
    <div className="space-y-6">
      <div>
        <FormLabel>Vehicle Photos</FormLabel>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos of your vehicle. Clear photos help your listing get more attention.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-40 border-dashed flex flex-col items-center justify-center"
            disabled={isUploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*';
              input.onchange = (e) => handleUpload((e.target as HTMLInputElement).files);
              input.click();
            }}
          >
            <Upload className="h-10 w-10 mb-2 text-gray-500" />
            <span>Click to upload photos</span>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG (max 10MB each)</p>
          </Button>
          
          {isUploading && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                Uploading {selectedFiles.length} {selectedFiles.length === 1 ? 'photo' : 'photos'}...
              </p>
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <div className="text-sm font-medium mb-2">Upload Requirements</div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• At least 3 photos of your vehicle</li>
            <li>• Include exterior front, back, and sides</li>
            <li>• Include interior dashboard and seats</li>
            <li>• Clear, well-lit images</li>
            <li>• Photos should be recent (last 30 days)</li>
          </ul>
        </Card>
      </div>
      
      {uploadedPhotos.length > 0 && (
        <div>
          <FormLabel>Uploaded Photos ({uploadedPhotos.length})</FormLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {uploadedPhotos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                <img 
                  src={photo} 
                  alt={`Vehicle photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
