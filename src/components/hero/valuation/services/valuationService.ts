import { supabase } from "@/integrations/supabase/client";
import { ValuationResult } from "../types";
import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export const getValuation = async (
  vin: string, 
  mileage: number, 
  gearbox: TransmissionType
): Promise<ValuationResult> => {
  console.log('Calling get-vehicle-valuation with:', { vin, mileage, gearbox });
  
  try {
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { 
        vin: vin.trim(),
        mileage: mileage,
        gearbox 
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data?.success) {
      console.error('Valuation failed:', data?.message);
      throw new Error(data?.message || "Failed to get vehicle valuation");
    }

    console.log('Valuation response:', data);

    return {
      ...data.data,
      make: data.data.make || 'Not available',
      model: data.data.model || 'Not available',
      year: parseInt(data.data.year) || new Date().getFullYear(),
      vin: vin,
      transmission: gearbox,
      valuation: data.data.price || data.data.valuation,
      averagePrice: data.data.averagePrice
    };
  } catch (error) {
    console.error('Error in getValuation:', error);
    throw error;
  }
};