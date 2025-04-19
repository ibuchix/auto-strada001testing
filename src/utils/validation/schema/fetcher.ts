
/**
 * Schema fetching functionality
 * Created: 2025-04-19 - Split from schemaValidation.ts
 */

import { supabase } from "@/integrations/supabase/client";
import { ColumnDefinition } from "./types";
import { rpcFunctionAvailableCache } from "./cache";

export const getTableSchema = async (
  tableName: string, 
  retryCount = 0
): Promise<ColumnDefinition[] | null> => {
  // Skip validation in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Check if we already know the RPC function is unavailable
  if (rpcFunctionAvailableCache[tableName] === false) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .rpc('get_table_columns' as any, { p_table_name: tableName })
      .select('column_name, data_type, is_nullable');

    if (error) {
      const isMissingFunctionError = 
        error.code === 'PGRST116' || 
        error.message?.includes('function') || 
        error.code === '404';
        
      if (isMissingFunctionError) {
        rpcFunctionAvailableCache[tableName] = false;
        return null;
      }
      
      const isTransientError = 
        error.code === 'TIMEOUT' || 
        error.code === '503' || 
        error.message?.includes('timeout') || 
        error.message?.includes('network');
        
      if (isTransientError && retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getTableSchema(tableName, retryCount + 1);
      }
      
      return null;
    }

    rpcFunctionAvailableCache[tableName] = true;
    
    return data?.map(col => ({
      name: col.column_name,
      type: col.data_type,
      isNullable: col.is_nullable === 'YES'
    })) || null;
  } catch (error) {
    return null;
  }
};
