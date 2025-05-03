
/**
 * SubmissionErrorHandler component
 * Created: 2025-07-18 - Fixed error category comparison
 */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { ErrorCode, ErrorCategory } from '@/errors/types';
import { AppError } from '@/errors/classes';

interface SubmissionErrorHandlerProps {
  error: AppError | Error | null;
  onRetry?: () => void;
  onIgnore?: () => void;
  onCancel?: () => void;
  isCritical?: boolean;
}

export const SubmissionErrorHandler: React.FC<SubmissionErrorHandlerProps> = ({ 
  error,
  onRetry,
  onIgnore,
  onCancel,
  isCritical = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (error) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  if (!error) return null;
  
  // Determine error category
  const errorCategory = error instanceof AppError ? error.category : 'unknown';
  const errorCode = error instanceof AppError ? error.code : 'unknown';
  
  // Get proper alert variant based on error type
  const getAlertVariant = () => {
    if (isCritical) return "destructive";
    
    if (error instanceof AppError) {
      if (error.category === ErrorCategory.VALIDATION) return "default";
      if (error.category === ErrorCategory.NETWORK) return "default";
    }
    
    return "destructive";
  };
  
  // Get proper icon based on error type
  const getErrorIcon = () => {
    if (errorCategory === ErrorCategory.VALIDATION) {
      return <AlertCircle className="h-5 w-5" />;
    }
    
    if (errorCategory === ErrorCategory.NETWORK) {
      return <AlertCircle className="h-5 w-5" />;
    }
    
    if (errorCategory === ErrorCategory.BUSINESS && errorCode === ErrorCode.SUBMISSION_ERROR) {
      return <Ban className="h-5 w-5" />;
    }
    
    return <AlertTriangle className="h-5 w-5" />;
  };
  
  // Get user-friendly error title
  const getErrorTitle = () => {
    if (errorCategory === ErrorCategory.VALIDATION) {
      return "Form Validation Error";
    }
    
    if (errorCategory === ErrorCategory.NETWORK) {
      return "Network Issue";
    }
    
    return "Submission Error";
  };
  
  // Get appropriate action buttons based on error type
  const getActionButtons = () => {
    return (
      <div className="flex space-x-2 mt-4 justify-end">
        {onCancel && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        
        {onIgnore && errorCategory === ErrorCategory.VALIDATION && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onIgnore}
          >
            Submit Anyway
          </Button>
        )}
        
        {onRetry && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={onRetry}
            disabled={isAnimating}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90"
          >
            {isAnimating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Try Again'
            )}
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <Alert 
      variant={getAlertVariant()}
      className={`my-4 ${isAnimating ? 'animate-pulse' : ''}`}
    >
      {getErrorIcon()}
      <AlertTitle>{getErrorTitle()}</AlertTitle>
      <AlertDescription>
        <p className="text-sm">{error.message}</p>
        
        {/* Show stack trace in dev mode */}
        {error.stack && import.meta.env.DEV && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer">Technical Details</summary>
            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
        
        {getActionButtons()}
      </AlertDescription>
    </Alert>
  );
};

export default SubmissionErrorHandler;
