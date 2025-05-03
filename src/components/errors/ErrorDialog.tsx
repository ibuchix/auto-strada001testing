
/**
 * ErrorDialog component for modal error display
 * Created: 2025-04-05
 * Updated: 2025-04-05 - Fixed TypeScript type issues
 * Updated: 2025-06-16 - Fixed error code comparison
 * Updated: 2025-07-01 - Fixed RecoveryAction usage as enum
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, WifiOff, ShieldAlert, ServerCrash } from 'lucide-react';
import { AppError } from '@/errors/classes';
import { ErrorCategory, RecoveryAction, ErrorCode } from '@/errors/types';

interface ErrorDialogProps {
  error: AppError | null;
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  error,
  open,
  onClose,
  onRetry
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
    } else if (error.recovery.action === RecoveryAction.SIGN_IN) {
      navigate('/auth');
    } else if (error.recovery.action === RecoveryAction.CONTACT_SUPPORT) {
      window.open('mailto:support@autostrada.com', '_blank');
    }
    
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getErrorIcon(error)}
            <DialogTitle>{getErrorTitle(error)}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-700">{error.message}</p>
          
          {error.category === ErrorCategory.NETWORK && (
            <div className="mt-4 bg-orange-50 border border-orange-100 rounded-md p-3 text-sm text-orange-800">
              Please check your internet connection before trying again.
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex gap-2">
            {onRetry && (!error.recovery || error.recovery.action !== RecoveryAction.RETRY) && (
              <Button 
                variant="outline" 
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
            
            {error.recovery && (
              <Button 
                variant={error.category === ErrorCategory.VALIDATION ? 'outline' : 'default'}
                className={error.category !== ErrorCategory.VALIDATION ? 'bg-[#DC143C] hover:bg-[#DC143C]/90' : ''}
                onClick={handleRecoveryAction}
              >
                {error.recovery.label}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get appropriate icon for the error
function getErrorIcon(error: AppError) {
  switch (error.category) {
    case ErrorCategory.NETWORK:
      return <WifiOff className="h-5 w-5 text-red-500" />;
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.AUTHORIZATION:
      return <ShieldAlert className="h-5 w-5 text-red-500" />;
    case ErrorCategory.SERVER:
      return <ServerCrash className="h-5 w-5 text-red-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
  }
}

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
