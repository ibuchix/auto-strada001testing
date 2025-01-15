import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];
type FuelType = Database['public']['Enums']['car_fuel_type'];
type CountryCode = Database['public']['Enums']['car_country_code'];

export interface ManualValuationRequest {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: TransmissionType;
  fuel: FuelType;
  country: CountryCode;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}