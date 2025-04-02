
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
 * - 2025-10-18: Fixed TypeScript type errors related to TransmissionType casting
 * - 2025-10-19: Fixed duplicate export issues causing SyntaxError
 * - 2025-11-01: Fixed VIN validation flow with improved error handling and logging
 */

import { ValuationResult, TransmissionType } from "../types";
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
    // Validate inputs before proceeding
    if (!vin || vin.length < 11 || vin.length > 17) {
      console.error('Invalid VIN format:', vin);
      return {
        success: false,
        data: {
          error: 'Invalid VIN format. Please enter a valid 17-character VIN.',
          vin,
          transmission: gearbox as TransmissionType
        }
      };
    }

    if (isNaN(mileage) || mileage < 0) {
      console.error('Invalid mileage value:', mileage);
      return {
        success: false,
        data: {
          error: 'Please enter a valid mileage value.',
          vin,
          transmission: gearbox as TransmissionType
        }
      };
    }
    
    // Delegate to the appropriate context handler with timeout
    const timeoutPromise = new Promise<ValuationResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, 15000); // 15 second timeout
    });
    
    // Cast the gearbox string to TransmissionType for type safety
    const transmissionType = gearbox as TransmissionType;
    
    console.log(`Calling ${context} valuation processor with:`, { vin, mileage, transmissionType });
    
    const valuationPromise = context === 'seller' 
      ? processSellerValuation(vin, mileage, transmissionType)
      : processHomeValuation(vin, mileage, transmissionType);
    
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
          transmission: gearbox as TransmissionType
        }
      };
    }
    
    return {
      success: false,
      data: {
        error: error.message || 'An unexpected error occurred',
        vin,
        transmission: gearbox as TransmissionType
      }
    };
  }
};

// No duplicate export here - cleanupValuationData is already exported above
