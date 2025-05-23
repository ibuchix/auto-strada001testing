
/**
 * Reserve Price Hook
 * Created: 2025-05-22
 * Purpose: Calculate and manage reserve prices consistently across the application
 * Updated: 2025-06-01 - Removed fallback logic and added error handling for missing reserve price
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  const [error, setError] = useState<string | null>(null);

  // Get reserve price directly from valuation data - no recalculations
  useEffect(() => {
    setIsCalculating(true);
    try {
      if (!valuationData) {
        setReservePrice(null);
        setError('No valuation data available');
        
        if (onCalculationComplete) {
          onCalculationComplete(null);
        }
        return;
      }
      
      // Get reserve price directly from valuation data
      const storedReservePrice = valuationData.reservePrice;
      
      if (!storedReservePrice || storedReservePrice <= 0) {
        console.error('Missing reserve price in valuation data:', valuationData);
        setReservePrice(null);
        setError('Missing reserve price data');
        
        // Show error toast prompting user to contact support
        toast.error('Error retrieving reserve price', {
          description: 'Please contact support for assistance with your listing.',
          duration: 5000
        });
        
        if (onCalculationComplete) {
          onCalculationComplete(null);
        }
        return;
      }
      
      console.log('Using stored reserve price:', storedReservePrice);
      setReservePrice(storedReservePrice);
      setError(null);
      
      if (onCalculationComplete) {
        onCalculationComplete(storedReservePrice);
      }
    } catch (error) {
      console.error("Error retrieving reserve price:", error);
      setReservePrice(null);
      setError('Error retrieving reserve price');
      
      // Show error toast prompting user to contact support
      toast.error('Error retrieving reserve price', {
        description: 'Please contact support for assistance with your listing.',
        duration: 5000
      });
      
      if (onCalculationComplete) {
        onCalculationComplete(null);
      }
    } finally {
      setIsCalculating(false);
    }
  }, [valuationData, onCalculationComplete]);

  return {
    reservePrice,
    isCalculating,
    error
  };
};
