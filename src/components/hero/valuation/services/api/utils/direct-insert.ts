
/**
 * Direct database insertion utilities with improved type safety
 * Changes:
 * - Added type assertions with validation for dynamic table names
 * - Ensured type safety without compromising flexibility
 * - Added runtime validation to ensure only valid table names are used
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// Type representing all valid table names in our database
type ValidTableName = keyof Database['public']['Tables'];

// Helper to validate if a string is a valid table name
const isValidTable = (table: string): table is ValidTableName => {
  // List of all valid tables in the database
  const validTables: ValidTableName[] = [
    'cars', 'profiles', 'sellers', 'dealers', 'bids', 'notifications',
    'auction_schedules', 'auction_results', 'vin_valuation_cache',
    'vin_reservations', 'service_history', 'manual_valuations',
    'damage_reports', 'system_logs', 'announcements', 'disputes',
    'auction_metrics', 'seller_performance_metrics', 'proxy_bids'
    // Add other table names as needed
  ];
  
  // Check if the provided table name is in our list of valid tables
  if (!validTables.includes(table as ValidTableName)) {
    console.warn(`Table validation failed: "${table}" is not a recognized table name`);
    return false;
  }
  
  return true;
};

// Insert a single value into a table with type safety
export const insertSingleValue = async (
  table: string,
  value: any,
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  // Validate table name before proceeding
  if (!isValidTable(table)) {
    const error = new Error(`Invalid table name: ${table}`);
    console.error(error);
    toast.error(`Database error: Invalid table`);
    if (onError) onError(error);
    return { error };
  }

  try {
    // Use type assertion with validation to allow dynamic table name
    const { data, error } = await supabase
      .from(table as ValidTableName)
      .insert(value)
      .select();

    if (error) throw error;
    
    if (onSuccess) onSuccess(data);
    return { data, error: null };
  } catch (error: any) {
    console.error(`Error inserting into ${table}:`, error);
    toast.error(`Error saving data: ${error.message || 'Unknown error'}`);
    if (onError) onError(error);
    return { data: null, error };
  }
};

// Upsert value (insert or update) with type safety
export const upsertValue = async (
  table: string,
  value: any,
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  // Validate table name before proceeding
  if (!isValidTable(table)) {
    const error = new Error(`Invalid table name: ${table}`);
    console.error(error);
    toast.error(`Database error: Invalid table`);
    if (onError) onError(error);
    return { error };
  }

  try {
    // Use type assertion with validation to allow dynamic table name
    const { data, error } = await supabase
      .from(table as ValidTableName)
      .upsert(value)
      .select();

    if (error) throw error;
    
    if (onSuccess) onSuccess(data);
    return { data, error: null };
  } catch (error: any) {
    console.error(`Error upserting into ${table}:`, error);
    toast.error(`Error saving data: ${error.message || 'Unknown error'}`);
    if (onError) onError(error);
    return { data: null, error };
  }
};

