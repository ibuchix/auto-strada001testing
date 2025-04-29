
/**
 * ValuationErrorContent component for displaying valuation error states
 * Created: 2025-04-29
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ValuationErrorContentProps {
  errorMessage: string;
  errorDescription: string;
  onClose: () => void;
  onRetry?: () => void;
  onManualValuation?: () => void;
  showManualOption?: boolean;
}

export const ValuationErrorContent: React.FC<ValuationErrorContentProps> = ({
  errorMessage,
  errorDescription,
  onClose,
  onRetry,
  onManualValuation,
  showManualOption = false,
}) => {
  return (
    <div className="p-4 bg-red-50 rounded-md border border-red-200">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <p className="text-red-700 font-medium">{errorMessage}</p>
      </div>
      <p className="text-sm text-red-600 mt-1">{errorDescription}</p>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onRetry}
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
      </div>
    </div>
  );
};
