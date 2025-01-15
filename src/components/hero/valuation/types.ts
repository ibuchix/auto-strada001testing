import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export interface ValuationData {
  valuation?: number;
  make?: string;
  model?: string;
  year?: number;
  [key: string]: any;
}

export interface ValuationResult {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: TransmissionType;
  valuation: number;
  isExisting?: boolean;
}

export interface ValuationState {
  vin: string;
  mileage: string;
  gearbox: TransmissionType;
}