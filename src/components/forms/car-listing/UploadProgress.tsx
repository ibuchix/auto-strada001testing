
/**
 * Changes made:
 * - 2025-05-03: Added error state and retry functionality
 * - 2027-08-12: Enhanced with better error feedback and state visualization
 * - 2028-05-30: Fixed type issues with indicatorClassName prop
 * - 2028-06-15: Added micro-interactions for progress and completion states
 * - 2025-04-05: Improved visual feedback with brand styling and smoother animations
 * - 2025-04-05: Added state-specific colors and better error handling
 */
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface UploadProgressProps {
  progress: number;
  error?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const UploadProgress = ({ progress, error, onRetry, className }: UploadProgressProps) => {
  const [animateProgress, setAnimateProgress] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  
  // Animate progress bar
  useEffect(() => {
    if (progress > animateProgress) {
      const timeout = setTimeout(() => {
        setAnimateProgress(prev => Math.min(prev + 2, progress));
      }, 10);
      return () => clearTimeout(timeout);
    }
    
    // Show completion animation
    if (progress === 100 && animateProgress === 100) {
      const timeout = setTimeout(() => {
        setShowComplete(true);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [progress, animateProgress]);
  
  if (progress === 0 && !error) return null;
  
  const getStatusText = () => {
    if (error) return "Upload error";
    if (showComplete) return "Upload complete";
    if (progress === 100) return "Finalizing...";
    return `Uploading (${Math.round(progress)}%)`;
  };
  
  const progressColor = error 
    ? "bg-primary" 
    : showComplete 
      ? "bg-success" 
      : "bg-primary";
  
  const statusIcon = error ? (
    <AlertCircle className="h-4 w-4 text-primary" />
  ) : showComplete ? (
    <CheckCircle className="h-4 w-4 text-success animate-scale-in" />
  ) : null;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-kanit flex items-center gap-1.5 transition-all duration-300">
          {statusIcon}
          {getStatusText()}
        </span>
        
        {error && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="text-xs font-kanit border-primary/20 text-primary hover:bg-primary/10 hover:text-primary animate-fade-in"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
      
      <Progress 
        value={animateProgress} 
        className={cn(
          "h-2 transition-all duration-300", 
          error ? "bg-primary/20" : "bg-accent"
        )}
        indicatorClassName={cn(
          "transition-all duration-300", 
          progressColor
        )}
      />
      
      {showComplete && (
        <div className="text-xs text-success flex items-center mt-1 animate-fade-in font-kanit">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready to submit
        </div>
      )}
    </div>
  );
};

