
/**
 * Changes made:
 * - 2024-11-24: Created utility helpers for validation functions
 * - 2028-06-12: Enhanced validation helpers with better error handling
 * - 2028-06-12: Added detailed logging to trace data flow and validation
 */

import { ValuationResult, TransmissionType } from "../../types";

/**
 * Check if the valuation data has all essential elements
 */
export function hasEssentialData(data: any): boolean {
  if (!data) {
    console.log("Validation failed: No data object");
    return false;
  }

  // Check for essential car information
  const hasBasicInfo = !!data.make && !!data.model;
  
  // Check for any pricing information
  const hasPricing = 
    (data.valuation !== undefined && data.valuation !== null) || 
    (data.reservePrice !== undefined && data.reservePrice !== null) ||
    (data.price !== undefined && data.price !== null) ||
    (data.price_med !== undefined && data.price_med !== null) ||
    (data.basePrice !== undefined && data.basePrice !== null);
  
  // Log validation details
  console.log("Essential data validation:", {
    hasBasicInfo,
    hasPricing,
    make: data.make,
    model: data.model,
    valuation: data.valuation,
    reservePrice: data.reservePrice,
    price: data.price,
    price_med: data.price_med,
    basePrice: data.basePrice
  });
  
  return hasBasicInfo && hasPricing;
}

/**
 * Store the reservation ID in localStorage
 */
export function storeReservationId(reservationId: string): void {
  try {
    localStorage.setItem('vinReservationId', reservationId);
    console.log('Stored reservation ID:', reservationId);
  } catch (error) {
    console.warn('Failed to store reservation ID in localStorage:', error);
  }
}

/**
 * Handle API errors in a consistent way
 */
export function handleApiError(
  error: any, 
  vin: string, 
  gearbox: TransmissionType
): ValuationResult {
  // Extract error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : (typeof error === 'string' ? error : 'Unknown error');
  
  // Log detailed error information
  console.error('API error details:', {
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    message: errorMessage,
    vinContext: vin,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  // Check for specific error conditions
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      success: false,
      data: {
        error: 'Rate limit exceeded. Please try again later.',
        vin,
        transmission: gearbox
      }
    };
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      success: false,
      data: {
        error: 'Request timed out. Please try again.',
        vin,
        transmission: gearbox
      }
    };
  }
  
  // Generic error response
  return {
    success: false,
    data: {
      error: errorMessage,
      vin,
      transmission: gearbox
    }
  };
}

/**
 * Format price value for display
 */
export function formatPrice(price: number | undefined): string {
  if (price === undefined || isNaN(price)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('pl-PL', { 
    style: 'currency', 
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

