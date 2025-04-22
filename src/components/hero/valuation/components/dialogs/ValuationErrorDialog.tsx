
/**
 * Changes made:
 * - 2025-04-29: Fixed DialogContent by adding proper description
 * - 2025-05-01: Enhanced error message display with better fallbacks
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";

interface ValuationErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: string;
  description?: string;
}

export const ValuationErrorDialog = ({
  isOpen,
  onClose,
  onRetry,
  error,
  description
}: ValuationErrorDialogProps) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    setIsRendered(true);
  }, []);

  if (!isRendered) {
    return null;
  }

  console.log('ValuationErrorDialog render:', {
    isOpen,
    error,
    description
  });

  // This ensures we always have a description for accessibility
  const dialogDescription = description || "There was a problem with your valuation request. Please try again or contact support.";
  
  // Make sure the error is not empty
  const displayError = error || "Unknown valuation error occurred";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Valuation Failed
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-red-50 rounded-md">
          <p className="text-red-800">{displayError}</p>
        </div>
        <DialogFooter className="flex sm:justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          {onRetry && (
            <Button
              type="button"
              onClick={() => {
                // First close the dialog
                onClose();
                // Then trigger retry
                setTimeout(() => onRetry(), 100);
              }}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
