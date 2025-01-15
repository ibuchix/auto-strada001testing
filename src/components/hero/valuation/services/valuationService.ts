import { supabase } from "@/integrations/supabase/client";
import { ValuationResult, ValuationData } from "../types";
import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export const checkExistingVin = async (vin: string) => {
  const { data: existingCar, error: vinCheckError } = await supabase
    .from('cars')
    .select('id, make, model, year, mileage, price, valuation_data')
    .eq('vin', vin)
    .eq('is_draft', false)
    .maybeSingle();

  if (vinCheckError) throw vinCheckError;
  return existingCar;
};

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

  return data.data;
};

export const createExistingValuation = (
  existingCar: any, 
  vin: string, 
  gearbox: TransmissionType,
  valuationData?: ValuationData
): ValuationResult => {
  return {
    make: existingCar.make || 'Not available',
    model: existingCar.model || 'Not available',
    year: existingCar.year || new Date().getFullYear(),
    vin: vin,
    transmission: gearbox,
    valuation: valuationData?.valuation || existingCar.price || 0,
    isExisting: true
  };
};