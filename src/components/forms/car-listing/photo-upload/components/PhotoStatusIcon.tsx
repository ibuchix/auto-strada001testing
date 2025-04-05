
/**
 * Component for displaying the photo status icon
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
 * - 2025-04-05: Enhanced with better visual styling and animations
 */
import { Check, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoStatusIconProps {
  isUploaded: boolean;
}

export const PhotoStatusIcon = ({ isUploaded }: PhotoStatusIconProps) => {
  if (isUploaded) {
    return (
      <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center transition-all duration-300 hover:bg-success/20 group">
        <Check className="h-6 w-6 text-success transition-transform duration-300 group-hover:scale-110" />
      </div>
    );
  }
  
  return (
    <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center transition-all duration-300 hover:bg-accent/70 group">
      <ImageIcon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
    </div>
  );
};

