
/**
 * Changes made:
 * - 2025-06-10: Created schema validation utility to compare form fields with database columns
 * - 2025-06-12: Fixed issue with RPC function type checking
 * - 2025-06-15: Added proper type assertion for RPC function call
 * - 2025-07-21: Fixed TypeScript error with RPC function name casting
 * - 2025-07-22: Updated getTableSchema to handle missing RPC function gracefully
 * - 2025-07-23: Fixed error with status property on PostgrestError type
 * - 2025-07-24: Implemented RPC function availability caching to prevent repeated failed calls
 * - 2025-07-24: Added environment-specific validation to avoid validation in production
 * - 2027-11-06: Enhanced error handling for PostgrestError types and improved logging
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
let rpcFunctionAvailableCache: Record<string, boolean> = {};

/**
 * Get column definitions for a specific table
 * With caching of RPC function availability to prevent repeated failed calls
 */
export const getTableSchema = async (tableName: string): Promise<ColumnDefinition[] | null> => {
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
      // Check if error is due to missing function (message check instead of status code)
      if (error.code === 'PGRST116' || 
          error.message?.includes('function') || 
          error.code === '404') {
        
        console.warn(`The get_table_columns RPC function is not available. Schema validation will be skipped.`);
        // Cache this result to avoid future calls
        rpcFunctionAvailableCache[tableName] = false;
        return null;
      }
      
      console.error(`Error fetching schema for ${tableName}:`, error);
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
    console.error('Error fetching table schema:', error);
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
  const { throwOnError = false, showWarnings = true } = options;
  
  // Skip validation in production
  if (!isDevelopment()) {
    return [];
  }
  
  const schema = await getTableSchema(tableName);
  const issues: string[] = [];
  
  // If schema is null, it means the RPC function is not available
  // In this case, we'll skip validation but not block form submission
  if (!schema) {
    console.log(`Schema validation skipped for table "${tableName}" - Schema information not available`);
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
    issues.forEach(issue => console.warn(`Schema validation warning: ${issue}`));
    
    toast.warning('Schema validation issues detected', {
      description: `${issues.length} issues found in ${tableName} form data`,
      action: {
        label: 'View in Console',
        onClick: () => console.table(issues)
      }
    });
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
    return validateFormAgainstSchema(formData, tableName, {
      throwOnError: false,
      showWarnings: true
    });
  } catch (error) {
    console.warn('Schema validation error:', error);
    // Return empty array to prevent blocking form submission
    return [];
  }
};
