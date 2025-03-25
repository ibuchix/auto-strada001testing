
/**
 * Changes made:
 * - 2025-07-14: Created reusable loading indicator component
 * - 2026-04-15: Enhanced with visual improvements and animation options
 */

import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  message?: string;
  fullscreen?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingIndicator = ({ 
  message = "Loading...", 
  fullscreen = false,
  size = 'medium',
  className = ""
}: LoadingIndicatorProps) => {
  const containerClasses = fullscreen 
    ? "min-h-screen flex items-center justify-center" 
    : "py-4 flex items-center justify-center";
    
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-8 h-8"
  };
  
  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center justify-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        {message && <p className={`text-subtitle ${size === 'small' ? 'text-sm' : 'text-base'}`}>{message}</p>}
      </div>
    </div>
  );
};
