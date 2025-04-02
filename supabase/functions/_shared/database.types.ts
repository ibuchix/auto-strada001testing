
/**
 * Type definitions for database entities
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          vin: string;
          seller_id: string;
          status: string;
          valuation_data: Json;
          is_draft: boolean;
          make: string;
          model: string;
          year: number;
          mileage: number;
          price: number;
          transmission: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vin: string;
          seller_id: string;
          status?: string;
          valuation_data?: Json;
          is_draft?: boolean;
          make?: string;
          model?: string;
          year?: number;
          mileage?: number;
          price?: number;
          transmission?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vin?: string;
          seller_id?: string;
          status?: string;
          valuation_data?: Json;
          is_draft?: boolean;
          make?: string;
          model?: string;
          year?: number;
          mileage?: number;
          price?: number;
          transmission?: string;
        };
      };
      
      vin_reservations: {
        Row: {
          id: string;
          user_id: string;
          vin: string;
          created_at: string;
          expires_at: string;
          status: string;
          valuation_data?: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          vin: string;
          created_at?: string;
          expires_at?: string;
          status?: string;
          valuation_data?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          vin?: string;
          created_at?: string;
          expires_at?: string;
          status?: string;
          valuation_data?: Json;
        };
      };
      
      vin_valuation_cache: {
        Row: {
          id: string;
          vin: string;
          mileage: number;
          valuation_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          vin: string;
          mileage: number;
          valuation_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          vin?: string;
          mileage?: number;
          valuation_data?: Json;
          created_at?: string;
        };
      };
    };
  };
}

// Type definitions for requests and responses
export type ValuationData = {
  make: string;
  model: string;
  year: number;
  price_min?: number;
  price_med?: number;
  price_max?: number;
  [key: string]: any;
};

export interface CarListing {
  id: string;
  seller_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  transmission: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}
