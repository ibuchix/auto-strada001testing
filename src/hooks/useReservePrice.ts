
/**
 * Reserve Price Hook
 * Created: 2025-05-22
 * Purpose: Calculate and manage reserve prices consistently across the application
 */

import { useState, useEffect } from 'react';
import { calculateReservePrice } from '@/utils/valuation/reservePriceCalculator';

interface UseReservePriceProps {
  valuationData?: any;
  onCalculationComplete?: (price: number | null) => void;
}

export const useReservePrice = ({ 
  valuationData,
  onCalculationComplete
}: UseReservePriceProps = {}) => {
  const [reservePrice, setReservePrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate reserve price using only our pricing logic
  useEffect(() => {
    const calculatePrice = async () => {
      setIsCalculating(true);
      try {
        if (valuationData && valuationData.basePrice) {
          const calculatedReserve = calculateReservePrice(valuationData.basePrice);
          console.log(`Calculated reserve price: ${calculatedReserve} from base ${valuationData.basePrice}`);
          setReservePrice(calculatedReserve);
          
          if (onCalculationComplete) {
            onCalculationComplete(calculatedReserve);
          }
        } else {
          console.log('No valuation data available, cannot calculate reserve price');
          setReservePrice(null);
          
          if (onCalculationComplete) {
            onCalculationComplete(null);
          }
        }
      } catch (error) {
        console.error("Error calculating reserve price:", error);
        setReservePrice(null);
        
        if (onCalculationComplete) {
          onCalculationComplete(null);
        }
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculatePrice();
  }, [valuationData, onCalculationComplete]);

  return {
    reservePrice,
    isCalculating
  };
};
