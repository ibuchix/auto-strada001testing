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

    // Extract the average price from the nested calcValuation object
    const averagePrice = data.data.functionResponse?.valuation?.calcValuation?.price_avr || 
                        data.data.functionResponse?.valuation?.calcValuation?.price || 
                        data.data.valuation || 
                        0;

    console.log('Extracted average price:', averagePrice);

    // Ensure all required fields are present
    const valuationResult: ValuationResult = {
      make: data.data.make || data.data.functionResponse?.userParams?.make || 'Not available',
      model: data.data.model || data.data.functionResponse?.userParams?.model || 'Not available',
      year: data.data.year || data.data.functionResponse?.userParams?.year || new Date().getFullYear(),
      vin: data.data.vin,
      transmission: data.data.transmission || gearbox,
      valuation: data.data.functionResponse?.valuation?.calcValuation?.price || 0,
      averagePrice: averagePrice,
      rawResponse: data.data
    };

    console.log('Processed valuation result:', valuationResult);
    return valuationResult;
  } catch (error: any) {
    console.error('Error in getValuation:', error);
    throw new Error(error.message || 'Failed to get vehicle valuation');
  }
};