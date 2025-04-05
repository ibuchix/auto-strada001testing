
/**
 * Changes made:
 * - 2025-04-06: Reduced debugging code while maintaining core functionality
 * - 2025-04-06: Added strict environment checks to prevent logging in production
 */

import { supabase } from "@/integrations/supabase/client";

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
let rpcFunctionAvailableCache: Record<string, boolean> = {};

/**
 * Get column definitions for a specific table
 * With caching of RPC function availability
 */
export const getTableSchema = async (tableName: string, retryCount = 0): Promise<ColumnDefinition[] | null> => {
  // Skip validation in production completely
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Check if we already know the RPC function is unavailable
  if (rpcFunctionAvailableCache[tableName] === false) {
    return null;
  }

  try {
    // Use type assertion with any to bypass TypeScript's strict checking of RPC function names
    const { data, error } = await supabase
      .rpc('get_table_columns' as any, { p_table_name: tableName })
      .select('column_name, data_type, is_nullable');

    if (error) {
      // Check if error is due to missing function
      const isMissingFunctionError = 
        error.code === 'PGRST116' || 
        error.message?.includes('function') || 
        error.code === '404';
        
      if (isMissingFunctionError) {
        // Cache this result to avoid future calls for this table
        rpcFunctionAvailableCache[tableName] = false;
        return null;
      }
      
      // For transient errors, we can retry if within limit
      const isTransientError = 
        error.code === 'TIMEOUT' || 
        error.code === '503' || 
        error.message?.includes('timeout') || 
        error.message?.includes('network');
        
      if (isTransientError && retryCount < 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return getTableSchema(tableName, retryCount + 1);
      }
      
      return null;
    }

    // If we got here, the RPC function is available - update cache
    rpcFunctionAvailableCache[tableName] = true;
    
    return data?.map(col => ({
      name: col.column_name,
      type: col.data_type,
      isNullable: col.is_nullable === 'YES'
    })) || null;
  } catch (error) {
    // For unexpected errors, we don't cache as permanently unavailable
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
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  
  const schema = await getTableSchema(tableName);
  const issues: string[] = [];
  
  // If schema is null, skip validation
  if (!schema) {
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
  if (showWarnings && issues.length > 0) {
    console.warn(`Schema validation issues for ${tableName}:`, issues);
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
 */
export const resetSchemaValidationCache = (tableName?: string): void => {
  if (process.env.NODE_ENV === 'production') return;
  
  if (tableName) {
    // Reset just for a specific table
    delete rpcFunctionAvailableCache[tableName];
  } else {
    // Reset for all tables
    rpcFunctionAvailableCache = {};
  }
};

/**
 * Safe form validator - only runs in development, returns empty array in production
 */
export const validateFormSchema = async (
  formData: Record<string, any>,
  tableName: string
): Promise<string[]> => {
  if (process.env.NODE_ENV === 'production') {
    return []; // Skip validation in production
  }
  
  try {
    return await validateFormAgainstSchema(formData, tableName, {
      throwOnError: false,
      showWarnings: false
    });
  } catch (error) {
    // Only log in development
    console.warn('Schema validation error:', error);
    return [];
  }
};

/**
 * Get schema validation diagnostics - only used in development
 */
export const getSchemaValidationDiagnostics = (): Record<string, any> => {
  if (process.env.NODE_ENV === 'production') {
    return {}; // Return empty object in production
  }
  
  return {
    timestamp: new Date().toISOString(),
    rpcCacheStatus: { ...rpcFunctionAvailableCache },
    environment: process.env.NODE_ENV
  };
};
