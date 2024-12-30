import { Input } from "@/components/ui/input";

interface AdditionalPhotosProps {
  isUploading: boolean;
  onFilesSelect: (files: File[]) => void;
}

export const AdditionalPhotos = ({ isUploading, onFilesSelect }: AdditionalPhotosProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Additional Photos (Optional)</h3>
      <p className="text-sm text-gray-600 mb-2">
        Upload up to 5 additional photos showing any damage or special features
      </p>
      <Input
        type="file"
        accept="image/*"
        multiple
        disabled={isUploading}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          onFilesSelect(files.slice(0, 5));
        }}
      />
    </div>
  );
};