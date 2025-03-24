
/**
 * Changes made:
 * - 2025-06-10: Created schema validation utility to compare form fields with database columns
 * - 2025-06-12: Fixed issue with RPC function type checking
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

/**
 * Get column definitions for a specific table
 */
export const getTableSchema = async (tableName: string): Promise<ColumnDefinition[] | null> => {
  try {
    // Use type assertion to bypass TypeScript's strict checking of RPC function names
    // This is necessary because the RPC function was added in a migration but TypeScript
    // doesn't know about it yet
    const { data, error } = await (supabase
      .rpc('get_table_columns', { table_name: tableName }) as any)
      .select('column_name, data_type, is_nullable');

    if (error) {
      console.error(`Error fetching schema for ${tableName}:`, error);
      return null;
    }

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
  const schema = await getTableSchema(tableName);
  const issues: string[] = [];
  
  if (!schema) {
    const message = `Could not fetch schema for table "${tableName}"`;
    issues.push(message);
    
    if (throwOnError) {
      throw new Error(message);
    }
    
    return issues;
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
 */
export const validateFormSchema = async (
  formData: Record<string, any>,
  tableName: string
): Promise<string[]> => {
  if (!isDevelopment()) {
    return []; // Skip validation in production
  }
  
  return validateFormAgainstSchema(formData, tableName, {
    throwOnError: false,
    showWarnings: true
  });
};
