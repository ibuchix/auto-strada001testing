import { supabase } from "@/integrations/supabase/client";
import { ValuationResult } from "../types";
import { Database } from "@/integrations/supabase/types";
import { extractPrice } from "@/utils/priceExtractor";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export const getValuation = async (
  vin: string, 
  mileage: number, 
  gearbox: TransmissionType
): Promise<ValuationResult> => {
  console.log('Getting valuation for:', { vin, mileage, gearbox });
  
  const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
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

  console.log('API Response:', data);

  // Extract price using the utility function
  const price = extractPrice(data.data);
  console.log('Extracted price:', price);

  const transformedData: ValuationResult = {
    ...data.data,
    make: data.data.make || 'Not available',
    model: data.data.model || 'Not available',
    year: parseInt(data.data.year) || new Date().getFullYear(),
    vin: vin,
    transmission: gearbox,
    valuation: price,
    averagePrice: price || data.data.averagePrice || data.data.price || data.data.valuation
  };

  console.log('Transformed valuation data:', transformedData);
  return transformedData;
};