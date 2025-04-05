
/**
 * Component for displaying the photo status icon
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
 */
import { Check, ImageIcon } from "lucide-react";

interface PhotoStatusIconProps {
  isUploaded: boolean;
}

export const PhotoStatusIcon = ({ isUploaded }: PhotoStatusIconProps) => {
  if (isUploaded) {
    return (
      <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
        <Check className="h-6 w-6 text-success" />
      </div>
    );
  }
  
  return (
    <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
      <ImageIcon className="h-6 w-6 text-primary" />
    </div>
  );
};
