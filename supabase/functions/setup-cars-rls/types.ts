
/**
 * Types for setup-cars-rls edge function
 * Created: 2025-04-19
 */

export interface CarsRLSResult {
  success: boolean;
  message?: string;
  executed?: string[];
  error?: string;
}

export interface RLSPolicy {
  policyname: string;
  tablename: string;
}

export interface DBResponse {
  data: any;
  error: any;
}
