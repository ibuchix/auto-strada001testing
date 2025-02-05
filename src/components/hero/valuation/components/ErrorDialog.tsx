import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorDialogProps {
  error: string;
  onClose: () => void;
  onRetry?: () => void;
  showManualOption?: boolean;
  onManualValuation?: () => void;
}

export const ErrorDialog = ({ 
  error, 
  onClose, 
  onRetry,
  showManualOption,
  onManualValuation 
}: ErrorDialogProps) => {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <AlertCircle className="h-6 w-6 text-[#DC143C]" />
          Vehicle Information Required
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 text-center">
        <p className="text-subtitle">{error}</p>
        {showManualOption && (
          <div className="bg-accent/50 p-4 rounded-lg">
            <p className="text-sm text-subtitle">
              Don't worry! You can still list your car by providing the details manually.
            </p>
          </div>
        )}
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
            className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
          >
            Try Different VIN
          </Button>
        )}
        {showManualOption && onManualValuation && (
          <Button 
            onClick={onManualValuation}
            className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white"
          >
            Continue Manually
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};