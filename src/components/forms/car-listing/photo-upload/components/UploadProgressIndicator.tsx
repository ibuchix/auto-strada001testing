
/**
 * Upload Progress Indicator Component
 * Created: 2025-05-30 - Phase 3: Enhanced progress indicators for image uploads
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadProgressIndicatorProps {
  isUploading: boolean;
  progress: number;
  currentPhotoType?: string;
  error?: string;
  showDetails?: boolean;
  className?: string;
}

export const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = ({
  isUploading,
  progress,
  currentPhotoType,
  error,
  showDetails = true,
  className
}) => {
  if (!isUploading && !error && progress === 0) {
    return null;
  }

  const getProgressColor = () => {
    if (error) return 'bg-red-500';
    if (progress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    if (error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (progress === 100 && !isUploading) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (isUploading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    return <Upload className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (error) {
      return 'Upload failed';
    }
    if (progress === 100 && !isUploading) {
      return 'Upload complete';
    }
    if (isUploading) {
      return currentPhotoType 
        ? `Uploading ${currentPhotoType}...` 
        : 'Uploading...';
    }
    return 'Ready to upload';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <div className="flex-1">
          <Progress 
            value={progress} 
            className={cn(
              "h-2 transition-all duration-300",
              error && "opacity-50"
            )}
          />
        </div>
        <span className="text-sm font-medium text-gray-600">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Status Text */}
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <span className={cn(
            "font-medium",
            error ? "text-red-600" : 
            progress === 100 ? "text-green-600" : 
            "text-blue-600"
          )}>
            {getStatusText()}
          </span>
          
          {isUploading && currentPhotoType && (
            <span className="text-gray-500">
              {currentPhotoType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UploadProgressIndicator;
