
/**
 * ErrorBanner component for displaying errors at the top of pages
 * Created: 2025-04-05
 * Updated: 2025-06-16 - Fixed error code comparison
 * Updated: 2025-06-18 - Fixed ErrorCode import
 * Updated: 2025-07-01 - Fixed RecoveryAction usage as enum
 * Updated: 2025-07-18 - Fixed route property and action types
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { AppError } from '@/errors/classes';
import { useNavigate } from 'react-router-dom';
import { RecoveryAction, ErrorCode, ErrorCategory } from '@/errors/types';

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
    } else if (error.recovery.action === RecoveryAction.NAVIGATE && error.recovery.url) {
      navigate(error.recovery.url);
    } else if (error.recovery.action === RecoveryAction.RETRY && onRetry) {
      onRetry();
    } else if (error.recovery.action === RecoveryAction.REFRESH) {
      window.location.reload();
    } else if (error.recovery.action === RecoveryAction.SIGN_IN) {
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
  if (error.category === ErrorCategory.VALIDATION) {
    return 'Validation Error';
  } else if (error.category === ErrorCategory.NETWORK) {
    return 'Network Connection Issue';
  } else if (error.category === ErrorCategory.AUTHENTICATION) {
    return 'Authentication Required';
  } else if (error.category === ErrorCategory.AUTHORIZATION) {
    return 'Access Denied';
  } else if (error.category === ErrorCategory.SERVER) {
    return 'Server Error';
  } else if (error.category === ErrorCategory.BUSINESS) {
    if (error.code === ErrorCode.SUBMISSION_ERROR && error.metadata?.type === 'valuation_error') {
      return 'Valuation Error';
    }
    return 'Operation Failed';
  } else {
    return 'Error Occurred';
  }
}
