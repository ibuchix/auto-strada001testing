
/**
 * ErrorBanner component for displaying errors at the top of pages
 * Created: 2025-04-05
 * Updated: 2025-06-16 - Fixed error code comparison
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { AppError } from '@/errors/classes';
import { useNavigate } from 'react-router-dom';
import { RecoveryAction } from '@/errors/types';

interface ErrorBannerProps {
  error: AppError | null;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onClose,
  onRetry,
  className = ''
}) => {
  const navigate = useNavigate();
  
  if (!error) {
    return null;
  }
  
  const handleRecoveryAction = () => {
    if (!error.recovery) return;
    
    if (error.recovery.handler) {
      error.recovery.handler();
    } else if (error.recovery.action === RecoveryAction.NAVIGATE && error.recovery.route) {
      navigate(error.recovery.route);
    } else if (error.recovery.action === RecoveryAction.RETRY && onRetry) {
      onRetry();
    } else if (error.recovery.action === RecoveryAction.REFRESH) {
      window.location.reload();
    } else if (error.recovery.action === RecoveryAction.AUTHENTICATE) {
      navigate('/auth');
    } else if (error.recovery.action === RecoveryAction.CONTACT_SUPPORT) {
      window.open('mailto:support@autostrada.com', '_blank');
    }
  };
  
  return (
    <Alert variant="destructive" className={`mb-6 ${className}`}>
      <XCircle className="h-5 w-5" />
      <AlertTitle>{getErrorTitle(error)}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{error.message}</p>
        
        <div className="mt-4 flex gap-3">
          {error.recovery && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRecoveryAction}
            >
              {error.recovery.label}
            </Button>
          )}
          
          {onRetry && (!error.recovery || error.recovery.action !== RecoveryAction.RETRY) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
          
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Helper function to get a user-friendly error title
function getErrorTitle(error: AppError): string {
  switch (error.category) {
    case 'validation':
      return 'Validation Error';
    case 'network':
      return 'Network Connection Issue';
    case 'authentication':
      return 'Authentication Required';
    case 'authorization':
      return 'Access Denied';
    case 'server':
      return 'Server Error';
    case 'business':
      if (error.code === ErrorCode.SUBMISSION_ERROR && error.metadata?.type === 'valuation_error') {
        return 'Valuation Error';
      }
      return 'Operation Failed';
    default:
      return 'Error Occurred';
  }
}
