import { supabase } from "@/integrations/supabase/client";

export const getValuation = async (vin: string, mileage: number, gearbox: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { vin, mileage, gearbox }
    });

    if (error) {
      console.error('Valuation error:', error);
      throw new Error(error.message || 'Failed to get valuation');
    }

    if (data.noData) {
      console.log('No valuation data found for VIN:', vin);
      return null;
    }

    if (!data || (!data.make && !data.model)) {
      console.log('Invalid valuation data for VIN:', vin);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('Valuation service error:', error);
    throw error;
  }
};