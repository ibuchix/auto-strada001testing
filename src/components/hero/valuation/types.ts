import { Database } from "@/integrations/supabase/types";

type TransmissionType = Database['public']['Enums']['car_transmission_type'];

export interface ValuationData {
  valuation?: number;
  price?: number;
  averagePrice?: number;
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  error?: string;
  [key: string]: any;
}

export interface ValuationResult {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: TransmissionType;
  capacity?: number;
  valuation?: number;
  averagePrice?: number;
  isExisting?: boolean;
  error?: string;
  rawResponse?: any;
}

export interface ValuationState {
  vin: string;
  mileage: string;
  gearbox: TransmissionType;
}