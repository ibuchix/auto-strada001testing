
/**
 * Dialog component for displaying valuation errors
 * 
 * Changes made:
 * - 2026-05-10: Enhanced with offline mode support and better error feedback
 * - 2026-05-12: Updated to work with revised useOfflineStatus hook
 * - 2025-04-17: Fixed button event handling and improved dialog controls
 * - 2025-04-17: Added errorDetails and valuation props for enhanced error information
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, WifiOff } from "lucide-react";
import { ValuationData } from "@/utils/valuation/valuationDataTypes";

interface ErrorDialogProps {
  error: string;
  errorDetails?: string;
  onClose: () => void;
  onRetry?: (() => void) | null;
  showManualOption?: boolean;
  onManualValuation?: () => void;
  isOffline?: boolean;
  valuation?: Partial<ValuationData>;
}

export const ErrorDialog = ({
  error,
  errorDetails,
  onClose,
  onRetry,
  showManualOption = false,
  onManualValuation,
  isOffline = false,
  valuation
}: ErrorDialogProps) => {
  // Add explicit event handling to prevent dialog auto-close behavior
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("ErrorDialog close clicked");
    onClose();
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("ErrorDialog retry clicked");
    if (onRetry) onRetry();
  };

  const handleManualValuation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Manual valuation clicked");
    if (onManualValuation) onManualValuation();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center">
            {isOffline ? (
              <WifiOff className="h-5 w-5 text-red-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <DialogTitle>
              {isOffline ? "Network Connection Issue" : "Valuation Error"}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <p className="text-gray-700">{error}</p>
          
          {errorDetails && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-600">
              {errorDetails}
            </div>
          )}
          
          {isOffline && (
            <div className="bg-orange-50 border border-orange-100 rounded-md p-3 text-sm text-orange-800">
              You appear to be offline. Please check your internet connection.
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            {onRetry && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleRetry}
                disabled={isOffline}
              >
                Try Again
              </Button>
            )}
            
            {showManualOption && onManualValuation && (
              <Button 
                variant="default"
                className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90"
                onClick={handleManualValuation}
              >
                Proceed with Manual Valuation
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={handleClose}
            >
              Close
            </Button>
            
            {isOffline && (
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
