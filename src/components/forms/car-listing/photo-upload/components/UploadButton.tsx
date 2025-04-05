
/**
 * Component for the upload button in photo upload cards
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
 */
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface UploadButtonProps {
  id: string;
  isUploading: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadButton = ({ 
  id, 
  isUploading, 
  disabled = false, 
  onChange 
}: UploadButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full font-kanit border-accent hover:bg-accent/20 hover:text-primary transition-all"
      disabled={isUploading || disabled}
    >
      <label
        htmlFor={`file-upload-${id}`}
        className="flex items-center justify-center w-full cursor-pointer"
      >
        <Upload className="h-4 w-4 mr-2" />
        <span>Upload</span>
        <input
          id={`file-upload-${id}`}
          type="file"
          className="hidden"
          onChange={onChange}
          accept="image/*"
          disabled={isUploading || disabled}
        />
      </label>
    </Button>
  );
};
