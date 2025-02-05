
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ValuationResult, ValuationData } from "../types";

export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: string,
  context: 'home' | 'seller' = 'home'
): Promise<ValuationResult> => {
  try {
    if (context === 'seller') {
      // Get current user's ID
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

      if (!data.success) {
        throw new Error(data.data?.error || 'Failed to validate VIN');
      }

      console.log('Seller validation response:', data);

      // Store reservation ID in localStorage if present
      if (data.data?.reservationId) {
        localStorage.setItem('vinReservationId', data.data.reservationId);
      }

      // Check for existing vehicle
      if (data.data?.isExisting) {
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

      // Return the data if it's valid
      if (data.data?.make && data.data?.model && data.data?.year) {
        return {
          success: true,
          data: data.data
        };
      }

      // If we have some data but it's incomplete, still return it
      if (data.data && Object.keys(data.data).length > 0) {
        return {
          success: true,
          data: {
            ...data.data,
            vin,
            transmission: gearbox
          }
        };
      }

      // Only set noData if we truly have no usable data
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

    // For non-seller context (home page)
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage, gearbox, context }
    });

    if (error) {
      console.error('Valuation error:', error);
      throw error;
    }

    console.log('Raw API Response:', data);

    // Only mark as noData if we truly have no usable information
    if (!data?.data?.make && !data?.data?.model && !data?.data?.year) {
      console.log('No usable data found for VIN');
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

    // If we have the essential data, return it
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
            // Clear any stored data
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
