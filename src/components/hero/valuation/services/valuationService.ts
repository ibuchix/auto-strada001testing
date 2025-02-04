
import { supabase } from "@/integrations/supabase/client";
import { ValuationResult } from "../types";

export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: string,
  context: 'home' | 'seller' = 'home'
): Promise<ValuationResult> => {
  try {
    // Set a timeout of 30 seconds for the entire operation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000);
    });

    // Main valuation logic wrapped in a promise
    const valuationPromise = async () => {
      // Check if VIN exists only for seller context
      if (context === 'seller') {
        // Set a shorter timeout for VIN check (5 seconds)
        const vinCheckPromise = supabase.rpc('check_vin_exists', {
          check_vin: vin
        });
        
        const vinCheckTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('VIN check timed out')), 5000);
        });

        const { data: exists, error: checkError } = await Promise.race([
          vinCheckPromise,
          vinCheckTimeout
        ]);

        if (checkError) {
          console.error('Error checking VIN:', checkError);
          throw new Error("Failed to check VIN status");
        }

        if (exists) {
          return {
            success: true,
            data: {
              isExisting: true,
              error: "This vehicle has already been listed"
            }
          };
        }
      }

      // API call for valuation
      const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
        body: { vin, mileage, gearbox, context }
      });

      if (error) {
        console.error('Valuation error:', error);
        throw new Error(error.message || "Failed to get vehicle valuation");
      }

      // Check if we have valid data
      if (data && data.success && data.data) {
        return {
          success: true,
          data: data.data
        };
      }

      // If we don't have valid data, throw an error
      throw new Error(data?.message || "Could not retrieve complete vehicle information");
    };

    // Race between the timeout and the actual operation
    const result = await Promise.race([valuationPromise(), timeoutPromise]);
    return result;

  } catch (error: any) {
    console.error('Valuation error:', error);
    
    // Provide more specific error messages based on the error type
    if (error.message.includes('timed out')) {
      throw new Error(
        "The request is taking longer than expected. Please check your connection and try again."
      );
    } else if (error.message.includes('VIN check')) {
      throw new Error(
        "Unable to verify VIN availability. Please try again in a few moments."
      );
    } else if (error.message.includes('vehicle valuation')) {
      throw new Error(
        "Unable to get vehicle valuation at the moment. Please try again later."
      );
    }

    throw new Error(error.message || "Failed to get vehicle valuation");
  }
};

