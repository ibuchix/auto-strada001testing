import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorDialogProps {
  error?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorDialog = ({ error, onClose, onRetry }: ErrorDialogProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          <AlertTriangle className="h-6 w-6 text-primary" />
          Valuation Error
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <p className="text-center text-subtitle">
          {error || "We couldn't get a valuation for your vehicle at this time."}
        </p>
        <p className="text-sm text-center text-subtitle">
          Please try again or enter your details manually.
        </p>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
          >
            Try Again
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};