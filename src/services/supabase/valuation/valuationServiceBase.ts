
/**
 * Changes made:
 * - 2024-10-15: Extracted base valuation functionality from valuationService.ts
 */

import { BaseService } from "../baseService";
import { toast } from "sonner";

export interface ValuationData {
  make?: string;
  model?: string;
  year?: number;
  valuation?: number;
  price?: number;
  averagePrice?: number;
  reservePrice?: number;
  vin?: string;
  [key: string]: any;
}

export class ValuationServiceBase extends BaseService {
  /**
   * Handle error with toast notification
   */
  protected handleValuationError(error: any, message: string): null {
    console.error(message, error);
    toast.error(error.message || message);
    return null;
  }
}
