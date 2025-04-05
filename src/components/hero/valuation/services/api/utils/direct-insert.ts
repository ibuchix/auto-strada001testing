
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

/**
 * Utility functions for direct database insertions with enhanced type safety
 * 
 * Changes:
 * - Preserved all existing functionality
 * - Added comprehensive type safety
 * - Maintained flexible table insertion capabilities
 */

// Define the type for valid table names based on our database schema
type ValidTableName = keyof Database['public']['Tables'];

/**
 * Validate that a given table name is a valid table in our database schema
 */
const isValidTable = (table: string): table is ValidTableName => {
  const validTables: ValidTableName[] = [
    'cars', 'profiles', 'sellers', 'dealers', 'bids', 'notifications',
    'auction_schedules', 'auction_results', 'vin_valuation_cache',
    'vin_reservations', 'service_history', 'manual_valuations',
    'damage_reports', 'system_logs', 'announcements', 'disputes',
    'auction_metrics', 'seller_performance_metrics', 'proxy_bids'
  ];
  
  const isValid = validTables.includes(table as ValidTableName);
  
  if (!isValid) {
    console.warn(`Attempted to use invalid table name: "${table}"`);
  }
  
  return isValid;
};

/**
 * Insert a single value into a table with type safety
 */
export const insertSingleValue = async <T>(
  table: ValidTableName, 
  data: T, 
  options: { upsert?: boolean } = {}
): Promise<{ data: T | null; error: any }> => {
  if (!isValidTable(table)) {
    return { 
      data: null, 
      error: new Error(`Invalid table name: ${table}`) 
    };
  }

  try {
    const query = options.upsert 
      ? supabase.from(table).upsert(data as any)
      : supabase.from(table).insert(data as any);

    const { data: insertedData, error } = await query.select();

    return { 
      data: insertedData as T | null, 
      error 
    };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { 
      data: null, 
      error 
    };
  }
};

/**
 * Upsert a value into a table with type safety
 */
export const upsertValue = async <T>(
  table: ValidTableName, 
  data: T
): Promise<{ data: T | null; error: any }> => {
  return insertSingleValue(table, data, { upsert: true });
};

