import { PhotoUpload } from "./PhotoUpload";
import { requiredPhotos } from "./types";
import { Progress } from "@/components/ui/progress";

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
        <h3 className="text-lg font-medium mb-2">Required Photos</h3>
        <Progress value={uploadProgress} className="mb-4" />
        <p className="text-sm text-gray-600 mb-4">
          Upload progress: {Math.round(uploadProgress)}%
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requiredPhotos.map(({ id, label }) => (
          <PhotoUpload
            key={id}
            id={id}
            label={label}
            isUploading={isUploading}
            onFileSelect={(file) => onFileSelect(file, id)}
          />
        ))}
      </div>
    </div>
  );
};