
/**
 * Reserve Price Section
 * Created: 2025-06-08
 * Displays the read-only reserve price calculated during valuation
 */

import { useFormData } from "../context/FormDataContext";
import { formatPrice } from "@/utils/valuation/reservePriceCalculator";
import { Lock } from "lucide-react";

export const ReservePriceSection = () => {
  const { form } = useFormData();
  
  if (!form) {
    return <div>Loading form...</div>;
  }
  
  // Get the reserve price from the form data
  const reservePrice = form.watch("reserve_price");
  
  if (!reservePrice) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-gray-600 italic">No reserve price data is available.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-[#EFEFFD] border border-[#4B4DED]/20 p-4 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lock className="h-4 w-4 text-[#4B4DED] mr-2" />
            <h4 className="text-sm font-medium text-gray-700">Your Reserve Price</h4>
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
