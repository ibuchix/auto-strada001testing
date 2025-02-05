
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValuationResult, ValuationData } from "../types";

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

      if (!data.success) {
        console.error('Validation failed:', data.data?.error);
        throw new Error(data.data?.error || 'Failed to validate VIN');
      }

      // Store reservation ID in localStorage if present
      if (data.data?.reservationId) {
        localStorage.setItem('vinReservationId', data.data.reservationId);
      }

      // Check for existing vehicle
      if (data.data?.isExisting) {
        console.log('Vehicle already exists in database');
        return {
          success: true,
          data: {
            vin,
            transmission: gearbox,
            isExisting: true,
            error: 'This vehicle has already been listed'
          }
        };
      }

      // Validate essential data
      const hasEssentialData = data.data?.make && data.data?.model && data.data?.year;
      console.log('Has essential data:', hasEssentialData, 'Data:', {
        make: data.data?.make,
        model: data.data?.model,
        year: data.data?.year
      });

      if (hasEssentialData) {
        console.log('Returning complete vehicle data');
        return {
          success: true,
          data: {
            make: data.data.make,
            model: data.data.model,
            year: data.data.year,
            vin,
            transmission: gearbox,
            valuation: data.data.valuation,
            averagePrice: data.data.averagePrice,
            isExisting: false
          }
        };
      }

      // Handle partial data case
      if (data.data && Object.keys(data.data).length > 0) {
        console.log('Returning partial data:', data.data);
        return {
          success: true,
          data: {
            ...data.data,
            vin,
            transmission: gearbox,
            noData: !hasEssentialData
          }
        };
      }

      console.log('No usable data found for VIN');
      return {
        success: true,
        data: {
          vin,
          transmission: gearbox,
          noData: true,
          error: 'Could not retrieve vehicle information'
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
          transmission: gearbox,
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
        transmission: gearbox,
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
        transmission: gearbox,
        error: error.message || 'Failed to get vehicle valuation'
      }
    };
  }
};
