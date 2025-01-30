import { supabase } from "@/integrations/supabase/client";

export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: string
) => {
  try {
    // First check if VIN already exists
    const { data: exists, error: checkError } = await supabase.rpc('check_vin_exists', {
      check_vin: vin
    });

    if (checkError) {
      console.error('Error checking VIN:', checkError);
      throw new Error("Failed to check VIN status");
    }

    if (exists) {
      return {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin,
        transmission: gearbox,
        isExisting: true,
        error: "This vehicle has already been listed"
      };
    }

    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage, gearbox }
    });

    if (error) {
      console.error('Valuation error:', error);
      throw new Error(error.message || "Failed to get vehicle valuation");
    }
    
    // Check if we have valid data
    if (data && data.success && data.data) {
      const valuationData = data.data;
      
      // Verify we have the essential fields
      if (valuationData.make && 
          valuationData.model && 
          valuationData.year && 
          !valuationData.error) {
        return valuationData;
      }
    }
    
    // If we don't have valid data, throw an error
    throw new Error(data?.message || "Could not retrieve complete vehicle information");
  } catch (error: any) {
    console.error('Valuation error:', error);
    throw new Error(error.message || "Failed to get vehicle valuation");
  }
};