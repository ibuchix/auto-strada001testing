
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
    // First check if VIN already exists
    const { data: existingCar } = await supabase
      .from('cars')
      .select('id, title')
      .eq('vin', vin)
      .eq('is_draft', false)
      .maybeSingle();

    if (existingCar) {
      console.log('Found existing car:', existingCar);
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

    // Check VIN search history
    const { data: searchHistory } = await supabase
      .from('vin_search_results')
      .select('search_data')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (searchHistory?.search_data) {
      console.log('Found cached valuation:', searchHistory.search_data);
      return {
        success: true,
        data: {
          ...searchHistory.search_data as ValuationData,
          transmission: gearbox,
          isExisting: false,
          vin
        }
      };
    }

    // API call for valuation with timeout handling
    const timeoutDuration = 240000; // 4 minutes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeoutDuration);
    });

    const valuationPromise = supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage, gearbox, context }
    });

    const result = await Promise.race([valuationPromise, timeoutPromise]);
    const { data, error } = result as any;

    if (error) {
      console.error('Valuation error:', error);
      throw error;
    }

    console.log('API Response:', data);

    // Check if we have valid data in the response
    const functionResponse = data?.functionResponse;
    
    // Properly validate the response structure
    if (functionResponse?.apiStatus === 'OK' && 
        functionResponse?.userParams?.make && 
        functionResponse?.userParams?.model &&
        functionResponse?.valuation?.calcValuation?.price) {

      const valuationData: ValuationData = {
        make: functionResponse.userParams.make,
        model: functionResponse.userParams.model,
        year: functionResponse.userParams.year,
        capacity: parseFloat(functionResponse.userParams.capacity),
        valuation: functionResponse.valuation.calcValuation.price,
        averagePrice: functionResponse.valuation.calcValuation.price_avr,
        vin,
        transmission: gearbox,
        isExisting: false
      };

      console.log('Constructed valuation data:', valuationData);

      return {
        success: true,
        data: valuationData
      };
    }

    // If we don't have valid data or API status is not OK
    console.log('No valid data found in response');
    return {
      success: true,
      data: {
        vin,
        transmission: gearbox,
        noData: true,
        error: 'No data found for this VIN'
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
