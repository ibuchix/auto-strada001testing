
/**
 * Changes made:
 * - Removed diagnostic-related code
 * - Enhanced UI for required photo angles with better visual organization
 * - Added photo angle descriptions and visual indicators
 * - Improved validation feedback for required photos
 * - Added section descriptions for different photo categories
 */

import { useState, useEffect } from "react";
import { PhotoUpload } from "./PhotoUpload";
import { FormValidationSummary } from "../validation/FormValidationSummary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Camera } from "lucide-react";
import { ValidationError, ValidationSeverity } from "../utils/validation";
import { PhotoValidationIndicator } from "../validation/PhotoValidationIndicator";
import { Separator } from "@/components/ui/separator";

interface RequiredPhotosProps {
  isUploading: boolean;
  progress?: number;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
  onValidationChange?: (isValid: boolean) => void;
}

export const RequiredPhotos = ({ 
  isUploading, 
  progress, 
  onFileSelect,
  onValidationChange
}: RequiredPhotosProps) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({
    exterior_front: false,
    exterior_rear: false,
    exterior_driver: false,
    exterior_passenger: false,
    interior_front: false,
    interior_rear: false,
    dashboard: false,
    odometer: false,
  });
  
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);

  // Check for any previously uploaded photos in localStorage
  useEffect(() => {
    if (!recoveryAttempted) {
      try {
        const savedPhotos = localStorage.getItem('uploadedRequiredPhotos');
        if (savedPhotos) {
          const parsedPhotos = JSON.parse(savedPhotos);
          setUploadedPhotos(prev => ({
            ...prev,
            ...parsedPhotos
          }));
          setRecoveryAttempted(true);
        }
      } catch (error) {
        console.error('Failed to recover photos', error);
      }
    }
  }, [recoveryAttempted]);

  // Save upload state to localStorage
  useEffect(() => {
    // Only save if we have at least one uploaded photo
    if (Object.values(uploadedPhotos).some(Boolean)) {
      localStorage.setItem('uploadedRequiredPhotos', JSON.stringify(uploadedPhotos));
    }
  }, [uploadedPhotos]);

  // Validate and notify parent
  useEffect(() => {
    const isValid = Object.values(uploadedPhotos).every(Boolean);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [uploadedPhotos, onValidationChange]);

  const handlePhotoUploaded = (type: string) => {
    setUploadedPhotos((prev) => {
      return { ...prev, [type]: true };
    });
    
    // Clear any errors for this photo
    if (uploadErrors[type]) {
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    }
  };
  
  const handleUploadError = (type: string, error: string) => {
    setUploadErrors(prev => ({
      ...prev,
      [type]: error
    }));
  };

  // Get completion percentage
  const getCompletionPercentage = () => {
    const totalPhotos = Object.keys(uploadedPhotos).length;
    const completedPhotos = Object.values(uploadedPhotos).filter(Boolean).length;
    return Math.round((completedPhotos / totalPhotos) * 100);
  };

  const exteriorPhotos = [
    {
      id: "exterior_front",
      title: "Front Exterior",
      description: "Front view showing headlights and grille",
    },
    {
      id: "exterior_rear",
      title: "Rear Exterior",
      description: "Rear view showing taillights and bumper",
    },
    {
      id: "exterior_driver",
      title: "Driver Side",
      description: "Full side view from driver's side",
    },
    {
      id: "exterior_passenger",
      title: "Passenger Side",
      description: "Full side view from passenger's side",
    },
  ];
  
  const interiorPhotos = [
    {
      id: "interior_front",
      title: "Front Interior",
      description: "Front seats and dashboard",
    },
    {
      id: "interior_rear",
      title: "Rear Interior",
      description: "Rear seats and legroom",
    },
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Clear view of dash and controls",
    },
    {
      id: "odometer",
      title: "Odometer",
      description: "Current mileage reading",
    },
  ];
  
  // Combine all photo arrays for validation
  const requiredPhotos = [...exteriorPhotos, ...interiorPhotos];
  
  // Generate validation errors for displaying in summary
  const validationErrors: ValidationError[] = requiredPhotos
    .filter(photo => !uploadedPhotos[photo.id])
    .map(photo => ({
      field: `photo_${photo.id}`,
      message: `${photo.title} photo is required`,
      severity: "error",
      recoverable: false
    }));

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Required Photos</h3>
      
      {/* Validation summary and progress indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">
            {validationErrors.length === 0 ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="mr-1 h-4 w-4" />
                All required photos uploaded
              </span>
            ) : (
              <span>
                {completionPercentage}% complete ({requiredPhotos.length - validationErrors.length}/{requiredPhotos.length})
              </span>
            )}
          </div>
        </div>
        
        {validationErrors.length > 0 ? (
          <FormValidationSummary 
            errors={validationErrors} 
          />
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="ml-2 text-green-700">
              All required photos have been uploaded. You can proceed to the next step.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Exterior photos section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Camera className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium">Exterior Photos</h4>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Please provide clear photos of all exterior angles of your vehicle in good lighting.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exteriorPhotos.map((photo) => (
            <div key={photo.id} className="space-y-1">
              <PhotoUpload
                id={photo.id}
                title={photo.title}
                description={photo.description}
                isUploading={isUploading}
                isUploaded={uploadedPhotos[photo.id]}
                progress={progress}
                isRequired={true}
                onUpload={async (file) => {
                  try {
                    const url = await onFileSelect(file, photo.id);
                    if (url) {
                      handlePhotoUploaded(photo.id);
                    } else {
                      handleUploadError(photo.id, "Upload failed");
                    }
                    return url;
                  } catch (error: any) {
                    handleUploadError(photo.id, error.message || "Upload failed");
                    return null;
                  }
                }}
              />
              <PhotoValidationIndicator 
                isUploaded={uploadedPhotos[photo.id]}
                isRequired={true}
                photoType={photo.title}
              />
            </div>
          ))}
        </div>
      </div>
      
      <Separator className="my-6" />
      
      {/* Interior photos section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Camera className="h-5 w-5 text-gray-600" />
          <h4 className="font-medium">Interior Photos</h4>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Please provide clear photos of the interior, dashboard, and current odometer reading.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {interiorPhotos.map((photo) => (
            <div key={photo.id} className="space-y-1">
              <PhotoUpload
                id={photo.id}
                title={photo.title}
                description={photo.description}
                isUploading={isUploading}
                isUploaded={uploadedPhotos[photo.id]}
                progress={progress}
                isRequired={true}
                onUpload={async (file) => {
                  try {
                    const url = await onFileSelect(file, photo.id);
                    if (url) {
                      handlePhotoUploaded(photo.id);
                    } else {
                      handleUploadError(photo.id, "Upload failed");
                    }
                    return url;
                  } catch (error: any) {
                    handleUploadError(photo.id, error.message || "Upload failed");
                    return null;
                  }
                }}
              />
              <PhotoValidationIndicator 
                isUploaded={uploadedPhotos[photo.id]}
                isRequired={true}
                photoType={photo.title}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
