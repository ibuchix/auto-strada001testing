
/**
 * Utility functions for direct database inserts via Supabase
 * Extracted to improve maintainability and reduce code duplication
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logDetailedError } from "./debug-utils";

/**
 * Insert a single value record directly to the database
 */
export async function insertSingleValue(
  table: string,
  data: Record<string, any>,
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .insert(data)
      .single();
    
    if (error) {
      // Fix: Convert error object to string message before passing to logDetailedError
      logDetailedError(`Failed to insert data into ${table}`, error.message);
      
      if (onError) {
        onError(error);
      } else {
        toast.error(`Failed to save data: ${error.message}`);
      }
      return false;
    }
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    logDetailedError(`Exception inserting data into ${table}`, 
      error instanceof Error ? error.message : String(error));
    
    if (onError) {
      onError(error);
    } else {
      toast.error("Failed to save data due to an unexpected error");
    }
    
    return false;
  }
}

/**
 * Upsert a record (insert or update) directly to the database
 */
export async function upsertValue(
  table: string,
  data: Record<string, any>,
  onConflict: string = 'id',
  onSuccess?: () => void,
  onError?: (error: any) => void
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .upsert(data, { onConflict })
      .single();
    
    if (error) {
      // Fix: Convert error object to string message before passing to logDetailedError
      logDetailedError(`Failed to upsert data in ${table}`, error.message);
      
      if (onError) {
        onError(error);
      } else {
        toast.error(`Failed to update data: ${error.message}`);
      }
      return false;
    }
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    logDetailedError(`Exception upserting data in ${table}`, 
      error instanceof Error ? error.message : String(error));
    
    if (onError) {
      onError(error);
    } else {
      toast.error("Failed to update data due to an unexpected error");
    }
    
    return false;
  }
}
