
/**
 * ReservePriceSection Component
 * Updated: 2025-06-21 - Fixed FormDataContext access
 * Updated: 2025-06-22 - Fixed type errors with calculateReservePrice return handling
 * Updated: 2025-06-23 - Fixed Promise handling in useEffect for async calculations
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 * Updated: 2025-05-29 - SIMPLIFIED for single reserve_price model - no more dual pricing
 */

import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { calculateReservePrice } from "../submission/utils/reservePriceCalculator";

export const ReservePriceSection = () => {
  const { form } = useFormData();
  const reservePrice = form.watch("reservePrice") || 0;
  const [calculatedReserve, setCalculatedReserve] = useState<number>(0);
  
  useEffect(() => {
    const calculateAndSetReserve = async () => {
      try {
        // If no reserve price set, calculate from standard pricing tiers
        if (!reservePrice || reservePrice <= 0) {
          // Use a default base price for calculation demonstration
          const basePrice = 50000; // Example base price
          const calculated = await Promise.resolve(calculateReservePrice(basePrice));
          setCalculatedReserve(calculated);
        } else {
          setCalculatedReserve(reservePrice);
        }
      } catch (error) {
        console.error("Error calculating reserve price:", error);
        setCalculatedReserve(0);
      }
    };
    
    calculateAndSetReserve();
  }, [reservePrice, form]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 font-oswald">Reserve Price</h2>
      <p className="text-gray-600 mb-4">
        Set the minimum price you're willing to accept for your vehicle.
      </p>
      
      <div className="space-y-4">
        <div>
          <FormField
            control={form.control}
            name="reservePrice"
            render={({ field }) => (
              <div className="space-y-2">
                <label className="font-medium text-sm">Reserve Price (PLN)</label>
                <Input
                  {...field}
                  type="number"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="bg-white"
                  placeholder="Enter your minimum acceptable price"
                />
                <p className="text-xs text-gray-500">
                  This is the minimum price you're willing to accept. The auction won't complete if bids don't reach this amount.
                </p>
              </div>
            )}
          />
        </div>
      </div>
    </Card>
  );
};
