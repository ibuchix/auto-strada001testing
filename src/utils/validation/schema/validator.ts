
/**
 * Core validation functionality
 * Created: 2025-04-19 - Split from schemaValidation.ts
 */

import { getTableSchema } from "./fetcher";
import { isTypeCompatible } from "./typeChecker";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
  recoverable: boolean;
}

export const validateFormAgainstSchema = async (
  formData: Record<string, any>,
  tableName: string,
  options: {
    throwOnError?: boolean;
    showWarnings?: boolean;
  } = {}
): Promise<string[]> => {
  const { throwOnError = false, showWarnings = false } = options;
  
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  
  const schema = await getTableSchema(tableName);
  const issues: string[] = [];
  
  if (!schema) {
    return [];
  }
  
  const schemaMap = new Map(schema.map(col => [col.name, col]));
  
  Object.entries(formData).forEach(([fieldName, value]) => {
    if (value === null || value === undefined) return;
    
    const columnName = fieldName === 'name' ? 'seller_name' : fieldName;
    const column = schemaMap.get(columnName);
    
    if (!column) {
      issues.push(`Field "${fieldName}" does not exist in the "${tableName}" table`);
      return;
    }
    
    const jsType = Array.isArray(value) ? 'array' : typeof value;
    if (!isTypeCompatible(jsType, column.type)) {
      issues.push(
        `Type mismatch for field "${fieldName}": JS type "${jsType}" is not compatible with DB type "${column.type}"`
      );
    }
  });
  
  if (showWarnings && issues.length > 0) {
    console.warn(`Schema validation issues for ${tableName}:`, issues);
  }
  
  if (throwOnError && issues.length > 0) {
    throw new Error(`Schema validation failed for table "${tableName}": ${issues.join(', ')}`);
  }
  
  return issues;
};
