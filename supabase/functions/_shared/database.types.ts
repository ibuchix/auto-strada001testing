
/**
 * Changes made:
 * - 2024-03-19: Created database types file for edge functions
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
          // ... add other fields as needed
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vin: string;
          seller_id: string;
          status?: string;
          valuation_data?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          vin?: string;
          seller_id?: string;
          status?: string;
          valuation_data?: Json;
        };
      };
      // Add other tables as needed
    };
    Enums: {
      car_transmission_type: "automatic" | "manual";
      // Add other enums as needed
    };
  };
};
