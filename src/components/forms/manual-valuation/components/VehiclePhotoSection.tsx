
/**
 * Component for vehicle photo uploads
 * - 2024-08-27: Fixed type definition for onFileSelect to accept Promise<string | null>
 * - 2025-05-20: Added upload progress indicator and current file display
 * - 2025-05-23: Fixed type definitions to properly handle File vs FileList compatibility
 * - 2025-05-24: Refactored for improved type safety and better compatibility
 */
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera } from "lucide-react";
import { RequiredPhotos } from "../../car-listing/photo-upload/RequiredPhotos";
import { AdditionalPhotos } from "../../car-listing/photo-upload/AdditionalPhotos";
import { Progress } from "@/components/ui/progress";

interface VehiclePhotoSectionProps {
  isUploading: boolean;
  progress: number;
  uploadingFile?: string | null;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
  onAdditionalPhotosSelect: (files: File[] | FileList) => void;
}

export const VehiclePhotoSection = ({
  isUploading,
  progress,
  uploadingFile,
  onFileSelect,
  onAdditionalPhotosSelect
}: VehiclePhotoSectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Photos</h2>

      <Alert className="mb-4 border-secondary/20 bg-secondary/5">
        <Camera className="h-4 w-4 text-secondary" />
        <AlertDescription className="ml-2">
          Please provide clear, well-lit photos of your vehicle. Include all angles of the exterior
          and key interior features. This helps us provide the most accurate valuation.
        </AlertDescription>
      </Alert>

      <RequiredPhotos
        isUploading={isUploading}
        onFileSelect={onFileSelect}
        progress={progress}
      />

      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            <p className="text-sm text-subtitle">Upload progress: {Math.round(progress)}%</p>
            {uploadingFile && <p className="text-sm text-subtitle">{uploadingFile}</p>}
          </div>
        </div>
      )}

      <AdditionalPhotos
        isUploading={isUploading}
        onFilesSelect={onAdditionalPhotosSelect}
      />
    </div>
  );
};
