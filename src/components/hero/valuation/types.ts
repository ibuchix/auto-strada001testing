
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
  isExisting?: boolean;
  [key: string]: any;
}

export interface ValuationResult {
  success: boolean;
  data: ValuationData;
}

export interface ValuationState {
  vin: string;
  mileage: string;
  gearbox: TransmissionType;
}
