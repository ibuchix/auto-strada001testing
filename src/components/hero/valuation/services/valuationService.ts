import { supabase } from "@/integrations/supabase/client";
import { ValuationResult } from "../types";

export const getValuation = async (
  vin: string,
  mileage: number,
  gearbox: 'manual' | 'automatic'
): Promise<ValuationResult> => {
  console.log('Calling getValuation with:', { vin, mileage, gearbox });

  try {
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { 
        vin: vin.trim(), 
        mileage: Number(mileage), 
        gearbox 
      },
    });

    console.log('Received response:', data);

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to fetch valuation');
    }

    if (!data?.success) {
      console.error('Valuation API failed:', data?.message);
      throw new Error(data?.message || 'Failed to get vehicle valuation');
    }

    if (!data.data) {
      console.error('No valuation data received');
      throw new Error('No valuation data received from the API');
    }

    // Extract the price directly from the nested structure
    const calcValuation = data.data.rawResponse?.functionResponse?.valuation?.calcValuation;
    const averagePrice = calcValuation?.price_avr;
    
    console.log('Extracted calcValuation:', calcValuation);
    console.log('Extracted average price:', averagePrice);

    const valuationResult: ValuationResult = {
      make: data.data.make || 'Not available',
      model: data.data.model || 'Not available',
      year: data.data.year || new Date().getFullYear(),
      vin: data.data.vin,
      transmission: data.data.transmission || gearbox,
      valuation: calcValuation?.price || 0,
      averagePrice: averagePrice || 0,
      rawResponse: data.data.rawResponse
    };

    console.log('Processed valuation result:', valuationResult);
    return valuationResult;
  } catch (error: any) {
    console.error('Error in getValuation:', error);
    throw new Error(error.message || 'Failed to get vehicle valuation');
  }
};