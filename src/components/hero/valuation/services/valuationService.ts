
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation service
 * - 2024-03-19: Added support for different contexts (home/seller)
 * - 2024-03-19: Enhanced error handling and response processing
 * - 2024-03-26: Fixed TypeScript errors related to TransmissionType
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValuationResult, ValuationData, TransmissionType } from "../types";

export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: string,
  context: 'home' | 'seller' = 'home'
): Promise<ValuationResult> => {
  console.log(`Starting valuation for VIN: ${vin} in ${context} context`);
  
  try {
    if (context === 'seller') {
      console.log('Processing seller context validation...');
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId: user?.id
        }
      });

      if (error) {
        console.error('Seller operation error:', error);
        throw error;
      }

      console.log('Seller validation raw response:', data);

      // If we get a success response but no essential data, treat as noData case
      const hasEssentialData = data?.data?.make && data?.data?.model && data?.data?.year;
      console.log('Has essential data:', hasEssentialData, 'Data:', {
        make: data?.data?.make,
        model: data?.data?.model,
        year: data?.data?.year
      });

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
          isExisting: false,
          reservationId: data.data.reservationId
        }
      };
    }

    // Home page context
    console.log('Processing home page valuation...');
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage, gearbox, context }
    });

    if (error) {
      console.error('Valuation error:', error);
      throw error;
    }

    console.log('Home page valuation raw response:', data);

    // Check for essential data
    const hasEssentialData = data?.data?.make && data?.data?.model && data?.data?.year;
    console.log('Has essential data:', hasEssentialData, 'Data:', {
      make: data?.data?.make,
      model: data?.data?.model,
      year: data?.data?.year
    });

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
    
    if (error.message === 'Request timed out') {
      toast.error("Request timed out", {
        description: "The valuation process took too long. Please try again.",
        action: {
          label: "Try Again",
          onClick: () => {
            localStorage.removeItem('valuationData');
            localStorage.removeItem('tempMileage');
            localStorage.removeItem('tempVIN');
            localStorage.removeItem('tempGearbox');
            localStorage.removeItem('vinReservationId');
            window.location.reload();
          }
        }
      });
    } else {
      toast.error(error.message || "Failed to get vehicle valuation");
    }

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
