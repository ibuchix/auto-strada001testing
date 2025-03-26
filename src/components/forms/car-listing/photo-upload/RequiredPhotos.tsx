
/**
 * Component for required photo uploads with correct type definitions
 * - 2024-08-27: Updated onFileSelect prop type to accept Promise<string | null>
 * - 2024-12-27: Fixed type incompatibility with PhotoUpload component
 * - 2025-05-03: Updated onFileSelect and onUpload to use consistent Promise<string | null> return type
 * - 2025-05-07: Added diagnosticId prop for improved debugging
 * - 2027-08-12: Enhanced with recovery mechanisms and better validation feedback
 */
import { useState, useEffect } from "react";
import { PhotoUpload } from "./PhotoUpload";
import { FormValidationSummary } from "../validation/FormValidationSummary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RequiredPhotosProps {
  isUploading: boolean;
  progress?: number;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
  diagnosticId?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export const RequiredPhotos = ({ 
  isUploading, 
  progress, 
  onFileSelect,
  diagnosticId,
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

  // Log for debugging purposes
  const logUploadEvent = (event: string, data: any) => {
    if (diagnosticId) {
      console.log(`[${diagnosticId}] [RequiredPhotos] ${event}:`, data);
    }
  };

  // Check for any previously uploaded photos in localStorage
  useEffect(() => {
    if (!recoveryAttempted) {
      try {
        const savedPhotos = localStorage.getItem('uploadedRequiredPhotos');
        if (savedPhotos) {
          const parsedPhotos = JSON.parse(savedPhotos);
          logUploadEvent('Recovered photos from localStorage', { savedPhotos: parsedPhotos });
          setUploadedPhotos(prev => ({
            ...prev,
            ...parsedPhotos
          }));
          setRecoveryAttempted(true);
        }
      } catch (error) {
        logUploadEvent('Failed to recover photos', { error });
      }
    }
  }, [recoveryAttempted, diagnosticId]);

  // Save upload state to localStorage
  useEffect(() => {
    // Only save if we have at least one uploaded photo
    if (Object.values(uploadedPhotos).some(Boolean)) {
      localStorage.setItem('uploadedRequiredPhotos', JSON.stringify(uploadedPhotos));
      logUploadEvent('Saved photos to localStorage', { uploadedPhotos });
    }
  }, [uploadedPhotos, diagnosticId]);

  // Validate and notify parent
  useEffect(() => {
    const isValid = Object.values(uploadedPhotos).every(Boolean);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [uploadedPhotos, onValidationChange]);

  const handlePhotoUploaded = (type: string) => {
    setUploadedPhotos((prev) => {
      const newState = { ...prev, [type]: true };
      logUploadEvent('Photo uploaded', { type, uploadedPhotos: newState });
      return newState;
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
    logUploadEvent('Upload error', { type, error });
  };

  const requiredPhotos = [
    {
      id: "exterior_front",
      title: "Front Exterior",
      description: "Front view of the car",
    },
    {
      id: "exterior_rear",
      title: "Rear Exterior",
      description: "Rear view of the car",
    },
    {
      id: "exterior_driver",
      title: "Driver Side",
      description: "Driver side of the car",
    },
    {
      id: "exterior_passenger",
      title: "Passenger Side",
      description: "Passenger side of the car",
    },
    {
      id: "interior_front",
      title: "Front Interior",
      description: "Front seats and dashboard",
    },
    {
      id: "interior_rear",
      title: "Rear Interior",
      description: "Rear seats",
    },
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Clear view of the dashboard",
    },
    {
      id: "odometer",
      title: "Odometer",
      description: "Current mileage reading",
    },
  ];
  
  // Generate validation errors for displaying in summary
  const validationErrors = requiredPhotos
    .filter(photo => !uploadedPhotos[photo.id])
    .map(photo => ({
      field: `photo_${photo.id}`,
      message: `${photo.title} photo is required`
    }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Required Photos</h3>
      
      {/* Validation summary */}
      {validationErrors.length > 0 ? (
        <FormValidationSummary 
          errors={validationErrors} 
        />
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-700">
            All required photos have been uploaded. You can proceed to the next step.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {requiredPhotos.map((photo) => (
          <PhotoUpload
            key={photo.id}
            id={photo.id}
            title={photo.title}
            description={photo.description}
            isUploading={isUploading}
            isUploaded={uploadedPhotos[photo.id]}
            progress={progress}
            isRequired={true}
            diagnosticId={diagnosticId}
            onUpload={async (file) => {
              logUploadEvent('Upload started', { photoId: photo.id });
              try {
                const url = await onFileSelect(file, photo.id);
                if (url) {
                  handlePhotoUploaded(photo.id);
                  logUploadEvent('Upload succeeded', { photoId: photo.id, url });
                } else {
                  logUploadEvent('Upload returned null', { photoId: photo.id });
                  handleUploadError(photo.id, "Upload failed");
                }
                return url;
              } catch (error: any) {
                logUploadEvent('Upload failed', { photoId: photo.id, error });
                handleUploadError(photo.id, error.message || "Upload failed");
                return null;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};
