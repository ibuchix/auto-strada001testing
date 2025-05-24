
/**
 * Reserve Price Hook
 * Created: 2025-05-22
 * Purpose: Calculate and manage reserve prices consistently across the application
 * Updated: 2025-06-01 - Removed fallback logic and added error handling for missing reserve price
 * Updated: 2025-05-24 - Fixed naming convention handling for both camelCase and snake_case
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

  // Get reserve price from valuation data - handle both naming conventions
  useEffect(() => {
    setIsCalculating(true);
    try {
      if (!valuationData) {
        console.log('useReservePrice: No valuation data provided');
        setReservePrice(null);
        setError('No valuation data available');
        
        if (onCalculationComplete) {
          onCalculationComplete(null);
        }
        return;
      }
      
      console.log('useReservePrice: Processing valuation data:', {
        hasReservePrice: !!valuationData.reservePrice,
        hasReserve_price: !!valuationData.reserve_price,
        hasValuation: !!valuationData.valuation,
        valuationDataKeys: Object.keys(valuationData)
      });
      
      // Check for reserve price in multiple possible formats
      let storedReservePrice = null;
      
      // Try camelCase first (preferred for new listings)
      if (valuationData.reservePrice && valuationData.reservePrice > 0) {
        storedReservePrice = valuationData.reservePrice;
        console.log('useReservePrice: Found reservePrice (camelCase):', storedReservePrice);
      }
      // Try snake_case (for older listings)
      else if (valuationData.reserve_price && valuationData.reserve_price > 0) {
        storedReservePrice = valuationData.reserve_price;
        console.log('useReservePrice: Found reserve_price (snake_case):', storedReservePrice);
      }
      // Try legacy valuation field
      else if (valuationData.valuation && valuationData.valuation > 0) {
        storedReservePrice = valuationData.valuation;
        console.log('useReservePrice: Found valuation (legacy):', storedReservePrice);
      }
      
      if (!storedReservePrice || storedReservePrice <= 0) {
        console.error('useReservePrice: Missing or invalid reserve price in valuation data:', {
          reservePrice: valuationData.reservePrice,
          reserve_price: valuationData.reserve_price,
          valuation: valuationData.valuation,
          fullData: valuationData
        });
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
      
      console.log('useReservePrice: Successfully using reserve price:', storedReservePrice);
      setReservePrice(storedReservePrice);
      setError(null);
      
      if (onCalculationComplete) {
        onCalculationComplete(storedReservePrice);
      }
    } catch (error) {
      console.error("useReservePrice: Error retrieving reserve price:", error);
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
