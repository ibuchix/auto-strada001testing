/**
 * Changes made:
 * - Reduced verbosity of console logging
 * - Added conditional logging based on environment
 * - Maintained key diagnostic information
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ColumnDefinition = {
  name: string;
  type: string;
  isNullable: boolean;
};

// Map JavaScript/TypeScript types to PostgreSQL types
export const typeMapping: Record<string, string[]> = {
  string: ['text', 'varchar', 'char', 'uuid', 'jsonb', 'json'],
  number: ['int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'integer', 'bigint'],
  boolean: ['bool', 'boolean'],
  object: ['jsonb', 'json'],
  array: ['_text', '_int4', '_int8', '_float4', '_float8', '_bool', 'jsonb', 'json', 'ARRAY'],
  Date: ['timestamp', 'timestamptz', 'date', 'time', 'timetz'],
};

// Cache for RPC function availability to prevent repeated failed calls
// Track by table name, with a true/false value indicating if the function is available
let rpcFunctionAvailableCache: Record<string, boolean> = {};

// Track specific error types for diagnostic purposes
interface ErrorMetrics {
  lastErrorTimestamp: number;
  errorCount: number;
  lastErrorMessage: string;
  lastErrorCode: string;
}

// Keep track of error metrics for diagnostic purposes
const errorMetrics: Record<string, ErrorMetrics> = {};

/**
 * Get column definitions for a specific table
 * With caching of RPC function availability to prevent repeated failed calls
 */
export const getTableSchema = async (tableName: string, retryCount = 0): Promise<ColumnDefinition[] | null> => {
  // Check if we already know the RPC function is unavailable
  if (rpcFunctionAvailableCache[tableName] === false) {
    console.log(`Skipping schema validation for "${tableName}" - RPC function previously found unavailable`);
    return null;
  }

  // Skip validation in production completely
  if (!isDevelopment()) {
    return null;
  }

  try {
    console.log(`Fetching schema for table "${tableName}" using get_table_columns RPC function`);
    
    // Use type assertion with any to bypass TypeScript's strict checking of RPC function names
    const { data, error } = await supabase
      .rpc('get_table_columns' as any, { p_table_name: tableName })
      .select('column_name, data_type, is_nullable');

    if (error) {
      // Update error metrics for this table
      const now = Date.now();
      if (!errorMetrics[tableName]) {
        errorMetrics[tableName] = {
          lastErrorTimestamp: now,
          errorCount: 1,
          lastErrorMessage: error.message || 'Unknown error',
          lastErrorCode: error.code || 'UNKNOWN'
        };
      } else {
        errorMetrics[tableName].errorCount++;
        errorMetrics[tableName].lastErrorTimestamp = now;
        errorMetrics[tableName].lastErrorMessage = error.message || 'Unknown error';
        errorMetrics[tableName].lastErrorCode = error.code || 'UNKNOWN';
      }

      // Check if error is due to missing function (message check instead of status code)
      const isMissingFunctionError = 
        error.code === 'PGRST116' || 
        error.message?.includes('function') || 
        error.code === '404';
        
      if (isMissingFunctionError) {
        console.warn(`The get_table_columns RPC function is not available. Schema validation will be skipped.`, {
          errorCode: error.code,
          errorMessage: error.message,
          tableName
        });
        
        // Cache this result to avoid future calls for this table
        rpcFunctionAvailableCache[tableName] = false;
        return null;
      }
      
      // For transient errors (network issues, timeouts), we can retry if within limit
      const isTransientError = 
        error.code === 'TIMEOUT' || 
        error.code === '503' || 
        error.message?.includes('timeout') || 
        error.message?.includes('network');
        
      if (isTransientError && retryCount < 1) {
        console.warn(`Transient error fetching schema for ${tableName}, retrying...`, {
          errorCode: error.code,
          errorMessage: error.message,
          retryCount
        });
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getTableSchema(tableName, retryCount + 1);
      }
      
      console.error(`Error fetching schema for ${tableName}:`, {
        error,
        errorMetrics: errorMetrics[tableName]
      });
      
      return null;
    }

    // If we got here, the RPC function is available - update cache
    rpcFunctionAvailableCache[tableName] = true;
    
    console.log(`Successfully retrieved schema for "${tableName}": ${data?.length} columns found`);

    return data?.map(col => ({
      name: col.column_name,
      type: col.data_type,
      isNullable: col.is_nullable === 'YES'
    })) || null;
  } catch (error) {
    console.error('Unexpected error fetching table schema:', error);
    
    // For unexpected errors, we still want to avoid repeated failed calls
    // But we won't cache it as permanently unavailable as it might be a temporary issue
    return null;
  }
};

/**
 * Check if a JavaScript value type is compatible with a PostgreSQL column type
 */
export const isTypeCompatible = (jsType: string, pgType: string): boolean => {
  // Special case for null/undefined
  if (jsType === 'undefined' || jsType === 'null') {
    return true; // Compatibility will be checked against isNullable
  }
  
  const compatibleTypes = typeMapping[jsType];
  if (!compatibleTypes) return false;
  
  return compatibleTypes.some(type => pgType.includes(type));
};

/**
 * Validate that a form object's fields match the table schema
 * Returns array of validation issues
 */
export const validateFormAgainstSchema = async (
  formData: Record<string, any>,
  tableName: string,
  options: {
    throwOnError?: boolean;
    showWarnings?: boolean;
  } = {}
): Promise<string[]> => {
  const { throwOnError = false, showWarnings = false } = options;
  
  // Skip validation in production
  if (!isDevelopment()) {
    return [];
  }
  
  const schema = await getTableSchema(tableName);
  const issues: string[] = [];
  
  // If schema is null, it means the RPC function is not available
  // In this case, we'll skip validation but not block form submission
  if (!schema) {
    if (isDevelopment()) {
      console.log(`Schema validation skipped for table "${tableName}" - Schema information not available`);
    }
    return [];
  }
  
  // Create a map for quick lookups
  const schemaMap = new Map<string, ColumnDefinition>();
  schema.forEach(col => schemaMap.set(col.name, col));
  
  // Check each form field against the schema
  Object.entries(formData).forEach(([fieldName, value]) => {
    // Skip null/undefined values
    if (value === null || value === undefined) return;
    
    // Handle name/seller_name special case (both represent the same field in the DB)
    const columnName = fieldName === 'name' ? 'seller_name' : fieldName;
    
    const column = schemaMap.get(columnName);
    
    // Check if field exists in the schema
    if (!column) {
      const message = `Field "${fieldName}" does not exist in the "${tableName}" table`;
      issues.push(message);
      return;
    }
    
    // Check type compatibility
    const jsType = Array.isArray(value) ? 'array' : typeof value;
    if (!isTypeCompatible(jsType, column.type)) {
      const message = `Type mismatch for field "${fieldName}": JS type "${jsType}" is not compatible with DB type "${column.type}"`;
      issues.push(message);
    }
  });
  
  // Show warnings if enabled and there are issues
  if (showWarnings && issues.length > 0 && isDevelopment()) {
    console.groupCollapsed(`Schema validation issues for ${tableName}`);
    issues.forEach(issue => console.warn(issue));
    console.groupEnd();
  }
  
  // Throw if configured to do so
  if (throwOnError && issues.length > 0) {
    throw new Error(`Schema validation failed for table "${tableName}": ${issues.join(', ')}`);
  }
  
  return issues;
};

/**
 * Development environment detection
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
};

/**
 * Reset the RPC function availability cache
 * This can be called if you want to retry validation after a function becomes available
 */
export const resetSchemaValidationCache = (tableName?: string): void => {
  if (tableName) {
    // Reset just for a specific table
    delete rpcFunctionAvailableCache[tableName];
    delete errorMetrics[tableName];
  } else {
    // Reset for all tables
    rpcFunctionAvailableCache = {};
    Object.keys(errorMetrics).forEach(key => delete errorMetrics[key]);
  }
  console.log(`Schema validation cache ${tableName ? `for ${tableName}` : 'completely'} reset`);
};

/**
 * Safe form validator - only runs in development, returns empty array in production
 * Now more resilient to missing RPC function and caches availability
 */
export const validateFormSchema = async (
  formData: Record<string, any>,
  tableName: string
): Promise<string[]> => {
  if (!isDevelopment()) {
    return []; // Skip validation in production
  }
  
  try {
    return await validateFormAgainstSchema(formData, tableName, {
      throwOnError: false,
      showWarnings: false
    });
  } catch (error) {
    // Only log in development
    if (isDevelopment()) {
      console.warn('Schema validation error:', error);
    }
    return [];
  }
};

/**
 * Get diagnostic information about schema validation issues
 * Useful for debugging persistent validation problems
 */
export const getSchemaValidationDiagnostics = (): Record<string, any> => {
  return {
    rpcFunctionAvailableCache,
    errorMetrics,
    environment: {
      isDevelopment: isDevelopment(),
      nodeEnv: process.env.NODE_ENV,
      hostname: window.location.hostname
    }
  };
};
