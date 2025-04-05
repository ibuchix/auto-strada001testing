
/**
 * Component for the upload button in photo upload cards
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
 * - 2025-04-05: Enhanced with better visual styling and hover effects
 */
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

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
      className={cn(
        "w-full font-kanit border-accent transition-all duration-300",
        disabled 
          ? "opacity-70 cursor-not-allowed" 
          : "hover:bg-accent/20 hover:text-primary hover:border-accent/60 hover:shadow-sm"
      )}
      disabled={isUploading || disabled}
    >
      <label
        htmlFor={`file-upload-${id}`}
        className="flex items-center justify-center w-full cursor-pointer"
      >
        <Upload className={cn(
          "h-4 w-4 mr-2 transition-transform duration-300",
          !disabled && "group-hover:translate-y-[-2px]"
        )} />
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

