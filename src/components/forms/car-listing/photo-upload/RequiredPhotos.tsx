import { PhotoUpload } from "./PhotoUpload";
import { requiredPhotos, photoQualityGuidelines } from "./types";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface RequiredPhotosProps {
  isUploading: boolean;
  onFileSelect: (file: File, type: string) => void;
  progress?: number;
}

export const RequiredPhotos = ({ isUploading, onFileSelect, progress }: RequiredPhotosProps) => {
  const totalPhotos = requiredPhotos.length;
  const uploadProgress = (progress || 0) * (100 / totalPhotos);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold mb-2">Required Photos</h3>
        <Alert className="mb-4 border-secondary/20 bg-secondary/5">
          <Camera className="h-4 w-4 text-secondary" />
          <AlertDescription className="ml-2">
            Please provide clear, well-lit photos following our guidelines for the best results.
            <ul className="mt-2 list-disc list-inside space-y-1">
              {photoQualityGuidelines.tips.map((tip, index) => (
                <li key={index} className="text-sm text-subtitle">{tip}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        <Progress value={uploadProgress} className="mb-4" />
        <p className="text-sm text-subtitle mb-6">
          Upload progress: {Math.round(uploadProgress)}%
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requiredPhotos.map(({ id, label, guideline }) => (
          <div key={id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{label}</span>
              <HoverCard>
                <HoverCardTrigger>
                  <Info className="h-4 w-4 text-subtitle cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p className="text-sm">{guideline}</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <PhotoUpload
              id={id}
              label={label}
              isUploading={isUploading}
              onFileSelect={(file) => onFileSelect(file, id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};