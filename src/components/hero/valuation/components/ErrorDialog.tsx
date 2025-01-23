import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorDialogProps {
  error?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorDialog = ({ error, onClose, onRetry }: ErrorDialogProps) => {
  const navigate = useNavigate();

  const handleManualValuation = () => {
    onClose();
    navigate('/manual-valuation');
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <AlertTriangle className="h-6 w-6 text-[#DC143C]" />
          We couldn't find your vehicle
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 text-center">
        <p className="text-subtitle">
          Don't worry! We can still help you get an accurate valuation for your vehicle.
        </p>
        <div className="bg-accent/50 p-4 rounded-lg">
          <p className="text-sm text-subtitle">
            Our manual valuation service provides:
          </p>
          <ul className="text-sm text-subtitle mt-2 space-y-1">
            <li>• Detailed assessment by our experts</li>
            <li>• Response within 24-48 hours</li>
            <li>• Personalized valuation report</li>
          </ul>
        </div>
      </div>

      <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
        {onRetry && (
          <Button 
            variant="outline"
            onClick={onRetry}
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>
        )}
        <Button 
          onClick={handleManualValuation}
          className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
        >
          Get Manual Valuation
        </Button>
        <Button 
          variant="ghost"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};