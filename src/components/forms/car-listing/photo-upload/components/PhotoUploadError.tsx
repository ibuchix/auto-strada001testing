
/**
 * Component for displaying photo upload errors
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
 * - 2025-04-05: Enhanced with better visual styling and animations
 */
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadErrorProps {
  error: string;
}

export const PhotoUploadError = ({ error }: PhotoUploadErrorProps) => {
  if (!error) return null;
  
  return (
    <div className={cn(
      "mt-2 flex items-start gap-1.5 text-xs text-primary bg-primary/5 p-2 rounded border border-primary/10",
      "animate-fade-in transition-all duration-300"
    )}>
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
      <span className="font-kanit">{error}</span>
    </div>
  );
};

