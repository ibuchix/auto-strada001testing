
/**
 * ValuationResult Component
 * Created: 2025-05-24 - Added to ensure ValuationForm renders properly
 * Updated: 2025-05-25 - Modified to only show reserve price to sellers
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LockIcon } from "lucide-react";

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

  // Handle successful valuation results - showing only reserve price
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
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    Your Reserve Price
                    <LockIcon size={14} className="text-gray-500" />
                  </h3>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">Fixed</Badge>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-2xl font-bold text-primary">
                    {typeof result.reservePrice === 'number' 
                      ? `${result.reservePrice.toLocaleString()} PLN`
                      : 'Not available'}
                  </p>
                  
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-gray-500">
                      Calculated based on mileage: {result.mileage ? result.mileage.toLocaleString() : '0'} km
                      and {result.transmission || 'manual'} transmission.
                    </p>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="text-sm text-blue-800 font-medium">
                        This price is fixed and cannot be changed
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        The reserve price is the minimum amount your car will sell for in the auction.
                        When you proceed to list your car, this price will be automatically used.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>No valuation data available</p>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onReset}>New Valuation</Button>
          <Button className="bg-primary hover:bg-primary/90">List My Car</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

