
/**
 * Error Dialog Component
 * Created: 2025-05-12
 * Purpose: Display errors in a dialog format with recovery options
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { AppError } from '@/errors/classes';

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error: Error | AppError | null;
  title?: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  showReport?: boolean;
  onReport?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  onClose,
  error,
  title = "An error occurred",
  description,
  showRetry = true,
  onRetry,
  showReport = false,
  onReport
}) => {
  // Determine error message and description based on error object
  const errorMessage = error instanceof Error ? error.message : (error?.toString() || "Unknown error");
  const errorDescription = description || (error instanceof AppError ? error.description : "Please try again or contact support if the problem persists.");
  
  // Determine if error has recovery options
  const hasRecovery = error instanceof AppError && error.recovery;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-red-500 font-medium">
            {errorMessage}
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-gray-600 mt-2">
          {errorDescription}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {hasRecovery && error instanceof AppError && error.recovery && (
            <Button 
              variant="default" 
              onClick={() => {
                if (error.recovery?.handler) {
                  error.recovery.handler();
                }
                onClose();
              }}
            >
              {error.recovery.label}
            </Button>
          )}
          
          {showRetry && onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          )}
          
          {showReport && onReport && (
            <Button variant="outline" onClick={onReport}>
              Report Issue
            </Button>
          )}
          
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
