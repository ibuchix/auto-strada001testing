
/**
 * Dialog component for displaying valuation errors with proper action handling
 * Created: 2025-04-16
 * Updated: 2025-04-17 - Fixed event propagation issues with dialog buttons
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ValuationErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  error: string;
}

export const ValuationErrorDialog = ({
  isOpen,
  onClose,
  onRetry,
  error
}: ValuationErrorDialogProps) => {
  console.log('ValuationErrorDialog render:', { isOpen, error });

  // Handlers with explicit event stopping to prevent dialog auto-close
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Close button clicked');
    onClose();
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Retry button clicked');
    onRetry();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertTriangle className="h-6 w-6 text-[#DC143C]" />
            Valuation Error
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700">{error}</p>
        </div>

        <DialogFooter className="sm:justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button
            onClick={handleRetry}
            className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
          >
            Try Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
