import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export interface ValuationData {
  valuation?: number;
  price?: number;
  averagePrice?: number;
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
  valuation?: number;
  averagePrice?: number;
  isExisting?: boolean;
}

export interface ValuationState {
  vin: string;
  mileage: string;
  gearbox: TransmissionType;
}