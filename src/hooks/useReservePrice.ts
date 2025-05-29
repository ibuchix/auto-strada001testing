
/**
 * Reserve Price Hook
 * Created: 2025-05-22
 * Purpose: Calculate and manage reserve prices consistently across the application
 * Updated: 2025-06-01 - Removed fallback logic and added error handling for missing reserve price
 * Updated: 2025-05-24 - Fixed naming convention handling for both camelCase and snake_case
 * Updated: 2025-05-29 - SIMPLIFIED for single reserve_price model - no more price confusion
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UseReservePriceProps {
  reservePrice?: number; // Direct reserve price value from database
  valuationData?: any; // Valuation data object (for legacy support)
  onCalculationComplete?: (price: number | null) => void;
}

export const useReservePrice = ({ 
  reservePrice,
  valuationData,
  onCalculationComplete
}: UseReservePriceProps = {}) => {
  const [calculatedReservePrice, setCalculatedReservePrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get reserve price from direct value or valuation data
  useEffect(() => {
    setIsCalculating(true);
    try {
      // If we have a direct reserve price, use it
      if (reservePrice && reservePrice > 0) {
        console.log('useReservePrice: Using direct reserve price:', reservePrice);
        setCalculatedReservePrice(reservePrice);
        setError(null);
        
        if (onCalculationComplete) {
          onCalculationComplete(reservePrice);
        }
        return;
      }
      
      // Fallback to valuation data for legacy support
      if (valuationData) {
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
        
        if (storedReservePrice && storedReservePrice > 0) {
          console.log('useReservePrice: Successfully using reserve price from valuation:', storedReservePrice);
          setCalculatedReservePrice(storedReservePrice);
          setError(null);
          
          if (onCalculationComplete) {
            onCalculationComplete(storedReservePrice);
          }
          return;
        }
      }
      
      // No valid reserve price found
      console.error('useReservePrice: No valid reserve price found:', {
        directReservePrice: reservePrice,
        valuationData: valuationData
      });
      
      setCalculatedReservePrice(null);
      setError('No reserve price available');
      
      // Show error toast prompting user to contact support
      toast.error('Reserve price not available', {
        description: 'Please contact support for assistance with your listing.',
        duration: 5000
      });
      
      if (onCalculationComplete) {
        onCalculationComplete(null);
      }
    } catch (error) {
      console.error("useReservePrice: Error retrieving reserve price:", error);
      setCalculatedReservePrice(null);
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
  }, [reservePrice, valuationData, onCalculationComplete]);

  return {
    reservePrice: calculatedReservePrice,
    isCalculating,
    error
  };
};
