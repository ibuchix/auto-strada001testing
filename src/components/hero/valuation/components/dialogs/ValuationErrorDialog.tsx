
/**
 * Changes made:
 * - 2025-05-01: Enhanced error handling for valuation failures
 * - 2025-05-01: Improved UI for clearer error explanations
 * - 2025-05-01: Added more descriptive guidance for users
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
import { X, RefreshCw, ClipboardList } from "lucide-react";

interface ValuationErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onManualValuation?: () => void;
  error: string;
  description?: string;
}

export const ValuationErrorDialog = ({
  isOpen,
  onClose,
  onRetry,
  onManualValuation,
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
    description,
    hasRetryHandler: !!onRetry,
    hasManualHandler: !!onManualValuation
  });

  // This ensures we always have a description for accessibility
  const dialogDescription = description || "There was a problem with your valuation request. Please try again or use manual listing.";
  
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
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-2">
          {onManualValuation && (
            <Button
              type="button"
              onClick={onManualValuation}
              className="flex-1 sm:flex-none"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Manual Listing
            </Button>
          )}
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                setTimeout(() => onRetry(), 100);
              }}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
