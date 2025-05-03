
/**
 * Error Dialog Component
 * Created: 2025-05-03
 * Purpose: Display error messages in a dialog for better user experience
 */

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppError } from "@/errors/classes";
import { AlertCircle } from "lucide-react";

interface ErrorDialogProps {
  error: AppError | Error | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  error,
  open,
  setOpen,
  title = "An error occurred",
  onRetry,
  onClose,
}) => {
  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  if (!error) return null;

  // Extract details from the error
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  const errorDetails = error instanceof AppError ? error.description : undefined;
  const errorCode = error instanceof AppError ? error.code : undefined;

  // For any error, ensure it can be safely converted to string
  const errorStack = error instanceof Error && error.stack ? 
    error.stack.toString() : 
    "No stack trace available";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-base">
            {errorMessage}
          </DialogDescription>
        </DialogHeader>

        {errorDetails && (
          <div className="text-sm text-muted-foreground">
            {errorDetails}
          </div>
        )}

        {errorCode && (
          <div className="text-xs text-muted-foreground">
            Error code: {errorCode}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {onRetry && (
            <Button onClick={onRetry}>
              Retry
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
