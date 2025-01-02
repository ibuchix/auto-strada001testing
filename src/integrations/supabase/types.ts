export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          car_id: string
          created_at: string | null
          dealer_id: string
          id: string
          status: string | null
        }
        Insert: {
          amount: number
          car_id: string
          created_at?: string | null
          dealer_id: string
          id?: string
          status?: string | null
        }
        Update: {
          amount?: number
          car_id?: string
          created_at?: string | null
          dealer_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_watchlist: {
        Row: {
          buyer_id: string
          car_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          buyer_id: string
          car_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          buyer_id?: string
          car_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_watchlist_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_watchlist_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_file_uploads: {
        Row: {
          car_id: string | null
          created_at: string | null
          file_path: string
          file_type: string
          id: string
          image_metadata: Json | null
          thumbnail_path: string | null
          upload_status: string
          uploaded_by: string | null
        }
        Insert: {
          car_id?: string | null
          created_at?: string | null
          file_path: string
          file_type: string
          id?: string
          image_metadata?: Json | null
          thumbnail_path?: string | null
          upload_status: string
          uploaded_by?: string | null
        }
        Update: {
          car_id?: string | null
          created_at?: string | null
          file_path?: string
          file_type?: string
          id?: string
          image_metadata?: Json | null
          thumbnail_path?: string | null
          upload_status?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_file_uploads_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_status_logs: {
        Row: {
          car_id: string
          created_at: string | null
          id: string
          new_status: string | null
          old_status: string | null
          updated_by: string
        }
        Insert: {
          car_id: string
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          updated_by: string
        }
        Update: {
          car_id?: string
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_status_logs_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_status_logs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          additional_photos: string[] | null
          address: string | null
          created_at: string | null
          description: string | null
          features: Json | null
          finance_amount: number | null
          finance_document_url: string | null
          has_documentation: boolean | null
          has_private_plate: boolean | null
          has_tool_pack: boolean | null
          id: string
          images: string[] | null
          is_damaged: boolean | null
          is_draft: boolean | null
          is_registered_in_poland: boolean | null
          is_selling_on_behalf: boolean | null
          last_saved: string | null
          make: string | null
          mileage: number
          mobile_number: string | null
          model: string | null
          name: string | null
          number_of_keys: number | null
          price: number
          registration_number: string | null
          required_photos: Json | null
          seat_material: string | null
          seller_id: string
          seller_notes: string | null
          service_history_files: string[] | null
          service_history_type:
            | Database["public"]["Enums"]["service_history_type"]
            | null
          status: string | null
          thumbnails: Json | null
          title: string
          updated_at: string | null
          valuation_data: Json | null
          vin: string
          year: number | null
        }
        Insert: {
          additional_photos?: string[] | null
          address?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          finance_amount?: number | null
          finance_document_url?: string | null
          has_documentation?: boolean | null
          has_private_plate?: boolean | null
          has_tool_pack?: boolean | null
          id?: string
          images?: string[] | null
          is_damaged?: boolean | null
          is_draft?: boolean | null
          is_registered_in_poland?: boolean | null
          is_selling_on_behalf?: boolean | null
          last_saved?: string | null
          make?: string | null
          mileage: number
          mobile_number?: string | null
          model?: string | null
          name?: string | null
          number_of_keys?: number | null
          price: number
          registration_number?: string | null
          required_photos?: Json | null
          seat_material?: string | null
          seller_id: string
          seller_notes?: string | null
          service_history_files?: string[] | null
          service_history_type?:
            | Database["public"]["Enums"]["service_history_type"]
            | null
          status?: string | null
          thumbnails?: Json | null
          title: string
          updated_at?: string | null
          valuation_data?: Json | null
          vin: string
          year?: number | null
        }
        Update: {
          additional_photos?: string[] | null
          address?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          finance_amount?: number | null
          finance_document_url?: string | null
          has_documentation?: boolean | null
          has_private_plate?: boolean | null
          has_tool_pack?: boolean | null
          id?: string
          images?: string[] | null
          is_damaged?: boolean | null
          is_draft?: boolean | null
          is_registered_in_poland?: boolean | null
          is_selling_on_behalf?: boolean | null
          last_saved?: string | null
          make?: string | null
          mileage?: number
          mobile_number?: string | null
          model?: string | null
          name?: string | null
          number_of_keys?: number | null
          price?: number
          registration_number?: string | null
          required_photos?: Json | null
          seat_material?: string | null
          seller_id?: string
          seller_notes?: string | null
          service_history_files?: string[] | null
          service_history_type?:
            | Database["public"]["Enums"]["service_history_type"]
            | null
          status?: string | null
          thumbnails?: Json | null
          title?: string
          updated_at?: string | null
          valuation_data?: Json | null
          vin?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          address: string | null
          created_at: string | null
          dealership_name: string
          id: string
          license_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          dealership_name: string
          id?: string
          license_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          dealership_name?: string
          id?: string
          license_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          password_hash: string
          phone_number: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password_hash: string
          phone_number?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string
          phone_number?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      service_history_type: "full" | "partial" | "none" | "not_due"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
