
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation service
 * - 2024-03-19: Added support for different contexts (home/seller)
 * - 2024-03-19: Enhanced error handling and response processing
 * - 2024-03-26: Fixed TypeScript errors related to TransmissionType
 * - 2024-07-20: Refactored for more robust error handling and rate limiting awareness
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValuationResult, ValuationData, TransmissionType } from "../types";

// Maximum number of retries for API calls
const MAX_RETRIES = 2;
// Timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

/**
 * Gets a valuation for a vehicle based on VIN, mileage, and transmission type
 */
export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: string,
  context: 'home' | 'seller' = 'home'
): Promise<ValuationResult> => {
  console.log(`Starting valuation for VIN: ${vin} in ${context} context`);
  
  // Store reservation ID if it exists in response
  const storeReservationId = (reservationId?: string) => {
    if (reservationId) {
      localStorage.setItem('vinReservationId', reservationId);
      console.log('Stored VIN reservation ID:', reservationId);
    }
  };
  
  // Create a timeout promise to handle API timeouts
  const timeoutPromise = () => {
    return new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, REQUEST_TIMEOUT);
    });
  };
  
  try {
    // Different handling for seller vs home context
    if (context === 'seller') {
      console.log('Processing seller context validation...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication error. Please sign in and try again.');
      }
      
      if (!user) {
        throw new Error('You must be logged in to value a vehicle for selling.');
      }
      
      // Call the function with retry logic
      const valuationPromise = executeWithRetry(async () => {
        return await supabase.functions.invoke('handle-seller-operations', {
          body: {
            operation: 'validate_vin',
            vin,
            mileage,
            gearbox,
            userId: user.id
          }
        });
      }, MAX_RETRIES);
      
      // Race against timeout
      const { data, error } = await Promise.race([
        valuationPromise,
        timeoutPromise()
      ]);

      if (error) {
        console.error('Seller operation error:', error);
        
        if (error.message?.includes('rate limit') || error.code === 'RATE_LIMIT_EXCEEDED') {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        }
        
        throw error;
      }

      console.log('Seller validation raw response:', data);

      // If the API returned an error
      if (!data.success) {
        const errorMessage = data.error || 'Unknown error occurred during valuation';
        const errorCode = data.errorCode || 'UNKNOWN_ERROR';
        
        if (errorCode === 'RATE_LIMIT_EXCEEDED') {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        }
        
        throw new Error(errorMessage);
      }

      // Store reservation ID for car creation process
      storeReservationId(data?.data?.reservationId);

      // Check for existing vehicle first
      if (data?.data?.isExisting) {
        console.log('Vehicle already exists in database');
        return {
          success: true,
          data: {
            vin,
            transmission: gearbox as TransmissionType,
            isExisting: true,
            error: 'This vehicle has already been listed'
          }
        };
      }

      // If we don't have essential data, mark as noData case
      const hasEssentialData = data?.data?.make && data?.data?.model && data?.data?.year;
      
      if (!hasEssentialData) {
        console.log('Missing essential vehicle data, marking as noData case');
        return {
          success: true,
          data: {
            vin,
            transmission: gearbox as TransmissionType,
            noData: true,
            error: 'Could not retrieve complete vehicle information',
            reservationId: data?.data?.reservationId
          }
        };
      }

      // If we have all essential data, return complete response
      console.log('Returning complete vehicle data');
      return {
        success: true,
        data: {
          make: data.data.make,
          model: data.data.model,
          year: data.data.year,
          vin,
          transmission: gearbox as TransmissionType,
          valuation: data.data.valuation,
          averagePrice: data.data.averagePrice,
          reservePrice: data.data.reservePrice,
          isExisting: false,
          reservationId: data.data.reservationId
        }
      };
    }

    // Home page context - simpler valuation without reservations
    console.log('Processing home page valuation...');
    
    // Call the function with retry logic
    const valuationPromise = executeWithRetry(async () => {
      return await supabase.functions.invoke('get-vehicle-valuation', {
        body: { vin, mileage, gearbox, context }
      });
    }, MAX_RETRIES);
    
    // Race against timeout
    const { data, error } = await Promise.race([
      valuationPromise,
      timeoutPromise()
    ]);

    if (error) {
      console.error('Valuation error:', error);
      
      if (error.message?.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }
      
      throw error;
    }

    console.log('Home page valuation raw response:', data);
    
    // If the API returned an error
    if (!data.success) {
      throw new Error(data.error || 'Failed to get vehicle valuation');
    }

    // Check for essential data
    const hasEssentialData = data?.data?.make && data?.data?.model && data?.data?.year;
    
    if (!hasEssentialData) {
      console.log('No essential data found for VIN in home context');
      return {
        success: true,
        data: {
          vin,
          transmission: gearbox as TransmissionType,
          noData: true,
          error: 'No data found for this VIN'
        }
      };
    }

    console.log('Returning complete valuation data for home context');
    return {
      success: true,
      data: {
        make: data.data.make,
        model: data.data.model,
        year: data.data.year,
        vin,
        transmission: gearbox as TransmissionType,
        valuation: data.data.valuation,
        averagePrice: data.data.averagePrice,
        isExisting: false
      }
    };

  } catch (error: any) {
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
          transmission: gearbox as TransmissionType,
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
          transmission: gearbox as TransmissionType,
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
        transmission: gearbox as TransmissionType,
        error: error.message || 'Failed to get vehicle valuation'
      }
    };
  }
};

/**
 * Utility to clean up all valuation-related data from localStorage
 */
export const cleanupValuationData = () => {
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('vinReservationId');
};

/**
 * Execute a function with retry logic
 */
async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries}`);
        // Exponential backoff: 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
      
      return await fn();
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      
      // Don't retry if it's a client error (4xx)
      if (error.status >= 400 && error.status < 500) {
        break;
      }
    }
  }
  
  throw lastError;
}
