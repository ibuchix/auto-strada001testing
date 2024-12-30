import { PhotoUpload } from "./PhotoUpload";
import { requiredPhotos } from "./types";

interface RequiredPhotosProps {
  isUploading: boolean;
  onFileSelect: (file: File, type: string) => void;
}

export const RequiredPhotos = ({ isUploading, onFileSelect }: RequiredPhotosProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Required Photos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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