
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

      // Check for noData scenario
      if (data.data?.noData) {
        return {
          success: true,
          data: {
            vin,
            transmission: gearbox,
            noData: true,
            error: data.data.error || 'Could not retrieve vehicle information'
          }
        };
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

      return {
        success: true,
        data: data.data
      };
    }

    // For non-seller context, use the existing vehicle valuation function
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage, gearbox, context }
    });

    if (error) {
      console.error('Valuation error:', error);
      throw error;
    }

    console.log('Raw API Response:', data);

    if (data?.data?.noData) {
      console.log('No data found for VIN');
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

    if (!data?.data?.make || !data?.data?.model || !data?.data?.year) {
      console.log('Invalid or missing data in response');
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
    
    // Handle timeout specifically
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
            window.location.reload();
          }
        }
      });
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
