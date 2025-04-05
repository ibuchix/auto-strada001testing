
/**
 * Component for displaying photo upload errors
 * - 2025-04-05: Extracted from PhotoUpload.tsx to improve maintainability
 */
import { AlertTriangle } from "lucide-react";

interface PhotoUploadErrorProps {
  error: string;
}

export const PhotoUploadError = ({ error }: PhotoUploadErrorProps) => {
  if (!error) return null;
  
  return (
    <div className="mt-2 flex items-start gap-1.5 text-xs text-primary">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
};
