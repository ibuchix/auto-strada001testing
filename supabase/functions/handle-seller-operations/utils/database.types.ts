
/**
 * Database type definitions for Supabase Edge Function
 * Copied locally for handle-seller-operations function to allow deployment.
 * Original source: ../../_shared/database.types.ts
 * Created: 2025-04-23
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vin_valuation_cache: {
        Row: {
          id: string
          mileage: number
          valuation_data: Json
          created_at: string
          vin: string
        }
        Insert: {
          id?: string
          mileage: number
          valuation_data: Json
          created_at?: string
          vin: string
        }
        Update: {
          id?: string
          mileage?: number
          valuation_data?: Json
          created_at?: string
          vin?: string
        }
      }
    }
  }
}
