
/**
 * Changes made:
 * - 2027-06-20: Created navigation debugging component as part of code refactoring
 */

import { useEffect } from "react";

interface NavigationDebuggerProps {
  componentId: string;
  data: Record<string, any>;
  isLoading: boolean;
  navigationAttempts: number;
}

export const NavigationDebugger = ({ 
  componentId, 
  data, 
  isLoading,
  navigationAttempts 
}: NavigationDebuggerProps) => {
  // Debug log component mount with unique IDs to trace in console
  useEffect(() => {
    console.log(`ValuationResult[${componentId}] - Component mounted with data:`, {
      hasData: !!data,
      make: data?.make,
      model: data?.model,
      valuation: data?.valuation,
      reservePrice: data?.reservePrice,
      valuationType: data?.valuation !== undefined ? typeof data.valuation : 'undefined',
      reservePriceType: data?.reservePrice !== undefined ? typeof data.reservePrice : 'undefined',
      hasError: !!data?.error,
      isLoading,
      navigationAttempts,
      timestamp: new Date().toISOString(),
      componentId
    });
    
    // Store debug info in localStorage
    try {
      localStorage.setItem('valuationResultDebug', JSON.stringify({
        mounted: true,
        timestamp: new Date().toISOString(),
        componentId,
        hasData: !!data,
        isLoading
      }));
    } catch (err) {
      console.warn("Failed to store debug info:", err);
    }
    
    // Check if we have incomplete valuation data
    if (data && !data.error && !data.make) {
      console.warn(`ValuationResult[${componentId}] - Incomplete valuation data detected:`, data);
    }
    
    // Cleanup and log on unmount
    return () => {
      console.log(`ValuationResult[${componentId}] - Component unmounting`, {
        navigationAttempts,
        timestamp: new Date().toISOString()
      });
      
      try {
        localStorage.setItem('valuationResultDebugUnmount', JSON.stringify({
          unmounted: true,
          timestamp: new Date().toISOString(),
          componentId,
          navigationAttempts
        }));
      } catch (err) {
        console.warn("Failed to store unmount debug info:", err);
      }
    };
  }, [componentId, data, isLoading, navigationAttempts]);
  
  // This is a utility component that doesn't render anything
  return null;
};
