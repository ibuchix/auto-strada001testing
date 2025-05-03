
/**
 * ReservePriceSection Component
 * Updated: 2025-06-21 - Fixed FormDataContext access
 * Updated: 2025-06-22 - Fixed type errors with calculateReservePrice return handling
 */

import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { calculateReservePrice } from "../submission/utils/reservePriceCalculator";

export const ReservePriceSection = () => {
  const { form } = useFormData();
  const price = form.watch("price") || 0;
  const [calculatedReserve, setCalculatedReserve] = useState<number>(0);
  
  useEffect(() => {
    const calculateAndSetReserve = async () => {
      // Get the reserve price
      const reservePrice = calculateReservePrice(Number(price));
      
      // Update local state with the calculated value
      setCalculatedReserve(reservePrice);
      
      // Set the reserve price in the form
      form.setValue("reserve_price", reservePrice);
    };
    
    calculateAndSetReserve();
  }, [price, form]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 font-oswald">Reserve Price</h2>
      <p className="text-gray-600 mb-4">
        Based on your selling price of {price.toLocaleString()} PLN, we've calculated a recommended reserve price.
      </p>
      
      <div className="space-y-4">
        <div>
          <FormField
            control={form.control}
            name="reserve_price"
            render={({ field }) => (
              <div className="space-y-2">
                <label className="font-medium text-sm">Reserve Price (PLN)</label>
                <Input
                  {...field}
                  type="number"
                  value={field.value || calculatedReserve}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="bg-gray-50"
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
