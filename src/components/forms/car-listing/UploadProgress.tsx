
/**
 * Changes made:
 * - 2025-05-03: Added error state and retry functionality
 */
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadProgressProps {
  progress: number;
  error?: boolean;
  onRetry?: () => void;
}

export const UploadProgress = ({ progress, error, onRetry }: UploadProgressProps) => {
  if (progress === 0 && !error) return null;
  
  const progressColor = error ? "bg-destructive" : progress === 100 ? "bg-green-500" : "bg-primary";
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {error 
            ? "Upload error" 
            : progress === 100 
              ? "Upload complete" 
              : `Uploading (${Math.round(progress)}%)`}
        </span>
        
        {error && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
      
      <Progress 
        value={progress} 
        className={`h-2 ${error ? 'bg-destructive/20' : 'bg-gray-200'}`}
        indicatorClassName={progressColor}
      />
    </div>
  );
};
