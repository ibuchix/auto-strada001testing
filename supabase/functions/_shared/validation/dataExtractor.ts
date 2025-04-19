
/**
 * Data extraction utilities
 * Created: 2025-04-19
 */
import { TransmissionType } from './types';
import { logOperation } from '../logging';

export function extractNestedValue(data: any, possibleKeys: string[]): string {
  if (!data) return "";
  
  // First try direct property access
  for (const key of possibleKeys) {
    if (key.includes('.')) {
      const value = getNestedProperty(data, key);
      if (value && typeof value === "string") {
        return value.trim();
      }
      continue;
    }
    
    if (data[key] && typeof data[key] === "string") {
      return data[key].trim();
    }
  }
  
  // Try one level deep
  for (const mainKey of Object.keys(data)) {
    if (data[mainKey] && typeof data[mainKey] === "object") {
      for (const key of possibleKeys) {
        if (data[mainKey][key] && typeof data[mainKey][key] === "string") {
          return data[mainKey][key].trim();
        }
      }
    }
  }
  
  return "";
}

export function extractNestedNumber(data: any, possibleKeys: string[]): number {
  if (!data) return 0;
  
  // First try direct property access
  for (const key of possibleKeys) {
    if (key.includes('.')) {
      const value = getNestedProperty(data, key);
      if (value !== undefined) {
        const num = Number(value);
        if (!isNaN(num) && num >= 0) {
          return num;
        }
      }
      continue;
    }
    
    const value = data[key];
    if (value !== undefined) {
      const num = Number(value);
      if (!isNaN(num) && num >= 0) {
        return num;
      }
    }
  }
  
  return 0;
}

function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}

export function extractTransmission(data: any): TransmissionType | undefined {
  const transmissionValue = extractNestedValue(data, [
    "transmission", "gearbox", "transmissionType"
  ]).toLowerCase();
  
  if (transmissionValue.includes("manual")) return "manual";
  if (transmissionValue.includes("auto")) return "automatic";
  return undefined;
}
