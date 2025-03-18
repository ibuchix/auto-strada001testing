
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation service
 * - 2024-03-19: Added support for different contexts (home/seller)
 * - 2024-03-19: Enhanced error handling and response processing
 * - 2024-03-26: Fixed TypeScript errors related to TransmissionType
 * - 2024-07-20: Refactored for more robust error handling and rate limiting awareness
 * - 2024-07-25: Refactored into smaller modules for better maintainability
 */

import { ValuationResult } from "../types";
import { processHomeValuation } from "./home-valuation";
import { processSellerValuation } from "./seller-valuation";
import { cleanupValuationData } from "./utils/validation-helpers";

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
  
  // Delegate to the appropriate context handler
  if (context === 'seller') {
    return processSellerValuation(vin, mileage, gearbox);
  } else {
    return processHomeValuation(vin, mileage, gearbox);
  }
};

// Re-export utility functions
export { cleanupValuationData };
