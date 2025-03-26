
/**
 * Changes made:
 * - 2025-05-03: Added error state and retry functionality
 * - 2027-08-12: Enhanced with better error feedback and state visualization
 * - 2028-05-30: Fixed type issues with indicatorClassName prop
 */
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  progress: number;
  error?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const UploadProgress = ({ progress, error, onRetry, className }: UploadProgressProps) => {
  if (progress === 0 && !error) return null;
  
  const getStatusText = () => {
    if (error) return "Upload error";
    if (progress === 100) return "Upload complete";
    return `Uploading (${Math.round(progress)}%)`;
  };
  
  const progressColor = error ? "bg-destructive" : progress === 100 ? "bg-green-500" : "bg-primary";
  const statusIcon = error ? (
    <AlertCircle className="h-4 w-4 text-destructive" />
  ) : progress === 100 ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : null;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium flex items-center gap-1.5">
          {statusIcon}
          {getStatusText()}
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
        // Use regular className prop instead of indicatorClassName
      />
    </div>
  );
};
