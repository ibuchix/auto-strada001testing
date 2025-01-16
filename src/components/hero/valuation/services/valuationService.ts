import { supabase } from "@/integrations/supabase/client";
import { ValuationResult } from "../types";
import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export const getValuation = async (
  vin: string, 
  mileage: number, 
  gearbox: TransmissionType
): Promise<ValuationResult> => {
  const { data, error } = await supabase.functions.invoke('get-car-valuation', {
    body: { 
      vin: vin.trim(),
      mileage: mileage,
      gearbox 
    }
  });

  if (error) throw error;
  if (!data?.success) {
    throw new Error(data?.message || "Failed to get vehicle valuation");
  }

  // Transform the response to include averagePrice
  const transformedData: ValuationResult = {
    ...data.data,
    averagePrice: data.data.averagePrice || data.data.price || data.data.valuation,
  };

  return transformedData;
};