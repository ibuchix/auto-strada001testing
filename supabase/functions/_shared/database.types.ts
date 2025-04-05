
/**
 * Minimal database type definitions for edge functions
 * Note: This is a simplified version of the full database types
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
      cars: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          vin: string
          make: string
          model: string
          year: number
          mileage: number
          transmission_type: string
          is_draft: boolean
          user_id: string
          [key: string]: any
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          vin: string
          make: string
          model: string
          year: number
          mileage: number
          transmission_type: string
          is_draft?: boolean
          user_id: string
          [key: string]: any
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          vin?: string
          make?: string
          model?: string
          year?: number
          mileage?: number
          transmission_type?: string
          is_draft?: boolean
          user_id?: string
          [key: string]: any
        }
      }
      vin_valuation_cache: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          vin: string
          mileage: number
          valuation_data: Json
          [key: string]: any
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          vin: string
          mileage: number
          valuation_data: Json
          [key: string]: any
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          vin?: string
          mileage?: number
          valuation_data?: Json
          [key: string]: any
        }
      }
      vin_reservations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          vin: string
          user_id: string
          status: string
          expires_at: string
          valuation_data: Json
          [key: string]: any
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          vin: string
          user_id: string
          status: string
          expires_at: string
          valuation_data?: Json
          [key: string]: any
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          vin?: string
          user_id?: string
          status?: string
          expires_at?: string
          valuation_data?: Json
          [key: string]: any
        }
      }
    }
    Views: {
      [key: string]: {
        Row: {
          [key: string]: any
        }
        Insert: {
          [key: string]: any
        }
        Update: {
          [key: string]: any
        }
      }
    }
    Functions: {
      [key: string]: {
        Args: {
          [key: string]: any
        }
        Returns: any
      }
    }
    Enums: {
      [key: string]: string[]
    }
  }
}
