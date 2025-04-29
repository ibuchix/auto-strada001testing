
/**
 * IncompleteDataDisplay component for incomplete valuation data
 * Created: 2025-04-29
 */

import React from "react";
import { Button } from "@/components/ui/button";

interface IncompleteDataDisplayProps {
  make?: string;
  model?: string;
  year?: number;
  reservePrice?: number;
  onClose: () => void;
}

export const IncompleteDataDisplay: React.FC<IncompleteDataDisplayProps> = ({
  make,
  model,
  year,
  reservePrice,
  onClose
}) => {
  return (
    <div className="p-4 bg-red-50 rounded-md border border-red-200">
      <p className="text-red-700 font-medium">Incomplete valuation data</p>
      <p className="text-sm text-red-600 mt-1">
        We couldn't retrieve complete valuation information for this vehicle. Please try again or 
        use manual valuation.
      </p>
      <p className="text-xs text-red-500 mt-2">
        Debug info: Make: {make || "missing"}, Model: {model || "missing"}, 
        Year: {year || "missing"}, Reserve Price: {reservePrice || "missing"}
      </p>
      
      <div className="mt-6">
        <Button 
          onClick={onClose}
          className="w-full"
          variant="outline"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
