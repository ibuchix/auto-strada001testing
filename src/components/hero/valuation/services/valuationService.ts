
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation service
 * - 2024-03-19: Added support for different contexts (home/seller)
 * - 2024-03-19: Enhanced error handling and response processing
 * - 2024-03-26: Fixed TypeScript errors related to TransmissionType
 * - 2024-07-20: Refactored for more robust error handling and rate limiting awareness
 * - 2024-07-25: Refactored into smaller modules for better maintainability
 * - 2025-05-15: Further refactored into context-specific modules for improved separation of concerns
 * - 2025-09-18: Added request timeout handling and additional error recovery
 */

import { ValuationResult } from "../types";
import { processHomeValuation } from "./home-valuation";
import { processSellerValuation } from "./seller-valuation";

/**
 * Cleans up any stale valuation data from localStorage
 */
export const cleanupValuationData = () => {
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('vinReservationId');
};

/**
 * Gets a valuation for a vehicle based on VIN, mileage, and transmission type.
 * This is the main entry point for all valuation operations.
 */
export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: string,
  context: 'home' | 'seller' = 'home'
): Promise<ValuationResult> => {
  console.log(`Starting valuation for VIN: ${vin} in ${context} context`);
  
  // Add request tracking to localStorage to help with troubleshooting
  try {
    localStorage.setItem('lastValuationAttempt', JSON.stringify({
      vin,
      mileage,
      gearbox,
      context,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Failed to store valuation attempt info:', e);
    // Non-critical, continue with operation
  }
  
  try {
    // Delegate to the appropriate context handler with timeout
    const timeoutPromise = new Promise<ValuationResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 15000); // 15 second timeout
    });
    
    const valuationPromise = context === 'seller' 
      ? processSellerValuation(vin, mileage, gearbox)
      : processHomeValuation(vin, mileage, gearbox);
    
    // Race between the valuation and the timeout
    return await Promise.race([valuationPromise, timeoutPromise]);
  } catch (error: any) {
    console.error(`Valuation error for VIN ${vin}:`, error);
    
    // Create a standardized error response
    if (error.message === 'Request timed out') {
      return {
        success: false,
        data: {
          error: 'Request timed out. Please try again.',
          vin,
          transmission: gearbox
        }
      };
    }
    
    return {
      success: false,
      data: {
        error: error.message || 'An unexpected error occurred',
        vin,
        transmission: gearbox
      }
    };
  }
};

// Re-export cleanupValuationData
export { cleanupValuationData };
