
/**
 * Reserve Price Section
 * Created: 2025-06-08
 * Displays the read-only reserve price calculated during valuation
 * Updated: 2025-06-09: Enhanced to ensure it properly shows the price from VIN check
 * Updated: 2025-06-14: Redesigned to match "YOUR RESERVE PRICE" format from valuation screen
 */

import { useFormData } from "../context/FormDataContext";
import { formatPrice } from "@/utils/valuation/reservePriceCalculator";
import { CircleDollarSign } from "lucide-react";
import { useEffect, useState } from "react";

export const ReservePriceSection = () => {
  const { form, watch } = useFormData();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Get the reserve price from the form data
  const reservePrice = watch("reserve_price");
  
  // Try to get reserve price from localStorage if not in form
  useEffect(() => {
    console.log("ReservePriceSection - Current form reserve_price:", reservePrice);
    
    // If reserve price is not set in form, try to get it from localStorage
    if (!reservePrice && form) {
      try {
        // Try to get it from localStorage first (direct value)
        const storedReservePrice = localStorage.getItem('tempReservePrice');
        
        if (storedReservePrice && !isNaN(Number(storedReservePrice))) {
          console.log("ReservePriceSection - Found reserve price in localStorage:", storedReservePrice);
          form.setValue("reserve_price", Number(storedReservePrice));
          setIsLoaded(true);
          return;
        }
        
        // Try to get from valuationData in localStorage
        const valuationDataStr = localStorage.getItem('valuationData');
        if (valuationDataStr) {
          const valuationData = JSON.parse(valuationDataStr);
          if (valuationData && (valuationData.reservePrice || valuationData.valuation)) {
            const reservePriceValue = valuationData.reservePrice || valuationData.valuation;
            if (reservePriceValue) {
              console.log("ReservePriceSection - Setting reserve price from valuation data:", reservePriceValue);
              form.setValue("reserve_price", Number(reservePriceValue));
              setIsLoaded(true);
              return;
            }
          }
        }
      } catch (error) {
        console.error("ReservePriceSection - Error loading reserve price:", error);
      }
    } else if (reservePrice) {
      setIsLoaded(true);
    }
  }, [reservePrice, form]);
  
  if (!form) {
    return <div>Loading form...</div>;
  }
  
  if (!reservePrice && !isLoaded) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-gray-600 italic">Loading reserve price data...</p>
      </div>
    );
  }
  
  if (!reservePrice) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-gray-600 italic">No reserve price data is available.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-[#4B4DED]/10 border border-[#4B4DED]/20 p-5 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CircleDollarSign className="h-5 w-5 text-[#4B4DED] mr-2" />
            <h4 className="text-sm font-medium text-[#383B39]">YOUR RESERVE PRICE</h4>
          </div>
          <div className="text-xl font-bold text-[#383B39]">
            {formatPrice(reservePrice)}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This is the minimum price your vehicle will be sold for during the auction.
          The reserve price was calculated based on your vehicle's valuation.
        </p>
      </div>
    </div>
  );
};
