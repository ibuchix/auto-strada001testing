
/**
 * Changes made:
 * - 2024-07-25: Extracted validation helpers from valuationService.ts
 */

import { toast } from "sonner";
import { TransmissionType, ValuationResult } from "../../types";

/**
 * Check if the valuation data has all essential fields
 */
export function hasEssentialData(data: any): boolean {
  return !!(data?.make && data?.model && data?.year);
}

/**
 * Handle API response errors
 */
export function handleApiError(error: any, vin: string, gearbox: TransmissionType): ValuationResult {
  console.error('Error in getValuation:', error);
  
  // Special handling for timeout errors
  if (error.message === 'Request timed out') {
    toast.error("Request timed out", {
      description: "The valuation process took too long. Please try again.",
      action: {
        label: "Try Again",
        onClick: () => {
          cleanupValuationData();
          window.location.reload();
        }
      }
    });
    
    return {
      success: false,
      data: {
        vin,
        transmission: gearbox,
        error: 'Request timed out'
      }
    };
  }
  
  // Handle rate limiting errors with friendlier message
  if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
    toast.error("Too many requests", {
      description: "Please wait a moment before trying again.",
    });
    
    return {
      success: false,
      data: {
        vin,
        transmission: gearbox,
        error: 'Too many requests. Please wait a moment before trying again.'
      }
    };
  }
  
  // For all other errors
  toast.error(error.message || "Failed to get vehicle valuation");

  return {
    success: false,
    data: {
      vin,
      transmission: gearbox,
      error: error.message || 'Failed to get vehicle valuation'
    }
  };
}

/**
 * Store reservation ID in localStorage if available
 */
export function storeReservationId(reservationId?: string): void {
  if (reservationId) {
    localStorage.setItem('vinReservationId', reservationId);
    console.log('Stored VIN reservation ID:', reservationId);
  }
}

/**
 * Utility to clean up all valuation-related data from localStorage
 */
export function cleanupValuationData(): void {
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('vinReservationId');
}
