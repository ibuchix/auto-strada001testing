
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ClipboardCheck } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { isOffline } = useOfflineStatus();
  
  // Determine if this is a network-related error
  const isNetworkError = error.toLowerCase().includes('network') ||
    error.toLowerCase().includes('connection') ||
    error.toLowerCase().includes('offline') ||
    isOffline;
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <AlertCircle className="h-6 w-6 text-[#DC143C]" />
          {isNetworkError ? "Connection Issue" : "Vehicle Information Required"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {isOffline && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You appear to be offline. Please check your internet connection.
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-subtitle text-center">{error}</p>
        
        {showManualOption && (
          <div className="bg-accent/50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm text-subtitle">
                Don't worry! You can still list your car by providing the details manually.
                Our team will review your information and provide a valuation within 24-48 hours.
              </p>
            </div>
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
        
        {onRetry && !isOffline && (
          <Button 
            onClick={onRetry}
            className="w-full sm:w-auto flex items-center gap-1 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
          >
            <RefreshCw className="h-3 w-3" />
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
