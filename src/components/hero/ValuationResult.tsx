
/**
 * ValuationResult Component
 * Created: 2025-05-24 - Added to ensure ValuationForm renders properly
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ValuationResultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: any;
  onReset: () => void;
}

export const ValuationResult: React.FC<ValuationResultProps> = ({
  open,
  onOpenChange,
  result,
  onReset
}) => {
  // Handle case where result contains an error
  if (result?.error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Valuation Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{result.error}</p>
            {result.noData && (
              <p className="mt-2">
                We couldn't find this vehicle in our database. Please check the VIN or try our manual valuation.
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onReset}>Try Again</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle successful valuation results
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vehicle Valuation</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {result ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Vehicle:</span>
                <span>{result.make} {result.model} {result.year}</span>
              </div>
              
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Market Value:</span>
                <span className="text-lg font-bold">
                  {typeof result.valuation === 'number' 
                    ? `${result.valuation.toLocaleString()} PLN` 
                    : 'Not available'}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Reserve Price:</span>
                <span className="text-primary font-bold">
                  {typeof result.reservePrice === 'number' 
                    ? `${result.reservePrice.toLocaleString()} PLN`
                    : 'Not available'}
                </span>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  This valuation is based on current market data for your vehicle with
                  {result.mileage ? ` ${result.mileage.toLocaleString()} km` : ''} and
                  a {result.transmission || 'manual'} transmission.
                </p>
              </div>
            </div>
          ) : (
            <p>No valuation data available</p>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onReset}>New Valuation</Button>
          <Button>List My Car</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
