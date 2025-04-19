
/**
 * Type compatibility checking functionality
 * Created: 2025-04-19 - Split from schemaValidation.ts
 */

import { typeMapping } from "./types";

export const isTypeCompatible = (jsType: string, pgType: string): boolean => {
  if (jsType === 'undefined' || jsType === 'null') {
    return true;
  }
  
  const compatibleTypes = typeMapping[jsType];
  if (!compatibleTypes) return false;
  
  return compatibleTypes.some(type => pgType.includes(type));
};
