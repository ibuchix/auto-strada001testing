
/**
 * Utilities for handling Supabase type conversions
 * Created: 2025-05-22
 */
import { Json } from '@/integrations/supabase/types';

/**
 * Converts a value to a JSON compatible value for Supabase
 */
export function toJsonValue(value: any): Json {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(toJsonValue) as Json[];
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const result: Record<string, Json> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = toJsonValue(value[key]);
      }
    }
    return result;
  }
  
  // Handle primitives
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value as Json;
  }
  
  // Fallback
  return JSON.parse(JSON.stringify(value));
}

/**
 * Type-safe cast for JSON responses from Supabase RPC calls
 */
export function safeJsonCast<T = Record<string, any>>(data: Json): T {
  return data as unknown as T;
}

/**
 * Safely ensures Date objects are converted to ISO strings for Supabase
 */
export function ensureDateString(date: Date | string | undefined | null): string | null {
  if (!date) return null;
  if (date instanceof Date) return date.toISOString();
  return date;
}

/**
 * Convert object to Supabase-compatible format with Json values
 */
export function toSupabaseObject<T extends Record<string, any>>(obj: T): Record<string, Json> {
  const result: Record<string, Json> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = toJsonValue(obj[key]);
    }
  }
  
  return result;
}
