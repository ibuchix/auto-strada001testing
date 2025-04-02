
/**
 * Dialog component for displaying valuation errors
 * 
 * Changes made:
 * - 2026-05-10: Enhanced with offline mode support and better error feedback
 * - 2026-05-12: Updated to work with revised useOfflineStatus hook
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, WifiOff } from "lucide-react";

interface ErrorDialogProps {
  error: string;
  onClose: () => void;
  onRetry?: (() => void) | null;
  showManualOption?: boolean;
  onManualValuation?: () => void;
  isOffline?: boolean;
}

export const ErrorDialog = ({
  error,
  onClose,
  onRetry,
  showManualOption = false,
  onManualValuation,
  isOffline = false
}: ErrorDialogProps) => {
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
                onClick={onRetry}
                disabled={isOffline}
              >
                Try Again
              </Button>
            )}
            
            {showManualOption && onManualValuation && (
              <Button 
                variant="default"
                className="w-full sm:w-auto bg-[#DC143C] hover:bg-[#DC143C]/90"
                onClick={onManualValuation}
              >
                Proceed with Manual Valuation
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={onClose}
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
