
import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";
import { createClient } from "@supabase/supabase-js";

export class ValuationApiService extends ValuationServiceBase {
  async getValuation(vin: string, mileage: number, gearbox: string): Promise<ValuationData | null> {
    try {
      // Remove cache check entirely
      const { data, error } = await this.supabase.functions.invoke('get-vehicle-valuation', {
        body: { 
          vin, 
          mileage, 
          gearbox 
        },
        headers: { 'X-Request-Timeout': '15000' }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      return this.handleValuationError(error, "Failed to get valuation");
    }
  }
  
  async getSellerValuation(vin: string, mileage: number, gearbox: string, userId: string): Promise<ValuationData | null> {
    try {
      const { data, error } = await this.supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Failed to validate VIN");
      }
      
      return data.data;
    } catch (error: any) {
      return this.handleValuationError(error, "Failed to get valuation");
    }
  }
}

export const valuationApiService = new ValuationApiService();
