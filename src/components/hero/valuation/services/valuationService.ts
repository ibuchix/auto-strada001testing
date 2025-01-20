import { supabase } from "@/integrations/supabase/client";
import { ValuationResult } from "../types";

export const getValuation = async (
  vin: string,
  mileage: number,
  transmission: string
): Promise<ValuationResult> => {
  console.log('Fetching valuation for:', { vin, mileage, transmission });
  
  try {
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: {
        vin,
        mileage,
        transmission
      }
    });

    if (error) {
      console.error('Valuation error:', error);
      throw new Error(error.message || "Failed to get valuation");
    }

    if (!data?.success) {
      console.error('Valuation failed:', data?.message);
      throw new Error(data?.message || "Failed to get valuation");
    }

    console.log('Valuation data received:', data);
    return data.data;
  } catch (error: any) {
    console.error('Error in getValuation:', error);
    throw new Error(error.message || "An unexpected error occurred");
  }
};

export const getManualValuation = async (data: {
  make: string;
  model: string;
  year: string;
  mileage: string;
  transmission: string;
  fuel: string;
  country: string;
}) => {
  console.log('Fetching manual valuation for:', data);
  
  try {
    const { data: response, error } = await supabase.functions.invoke('get-manual-valuation', {
      body: data
    });

    if (error) {
      console.error('Manual valuation error:', error);
      throw new Error(error.message || "Failed to get manual valuation");
    }

    if (!response?.success) {
      console.error('Manual valuation failed:', response?.message);
      throw new Error(response?.message || "Failed to get manual valuation");
    }

    console.log('Manual valuation data received:', response);
    return response.data;
  } catch (error: any) {
    console.error('Error in getManualValuation:', error);
    throw new Error(error.message || "An unexpected error occurred");
  }
};