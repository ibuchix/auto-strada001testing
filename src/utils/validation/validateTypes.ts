
/**
 * Utility functions for validation and normalization of common types
 * Created: 2025-04-28
 * Updated: 2025-04-28 - Fixed transmission normalization to ensure compatibility with component props
 */

/**
 * Normalizes transmission type input to standard values
 * When used with ValuationContent, always use the simpler 'manual' | 'automatic' return type
 */
export function normalizeTransmission(transmission?: string): 'manual' | 'automatic' | 'semi-automatic' | 'cvt' {
  if (!transmission) return 'manual';
  
  const normalized = transmission.toLowerCase().trim();
  
  if (normalized === 'automatic' || normalized === 'auto') {
    return 'automatic';
  } else if (normalized === 'semi-automatic' || normalized === 'semi auto' || normalized === 'semiauto') {
    return 'semi-automatic';
  } else if (normalized === 'cvt' || normalized === 'variable' || normalized === 'continuous') {
    return 'cvt';
  }
  
  // Default to manual
  return 'manual';
}

/**
 * Simplifies transmission type for components that only support 'manual' | 'automatic'
 * This ensures compatibility between different transmission type definitions
 */
export function simplifyTransmission(transmission?: string): 'manual' | 'automatic' {
  const normalizedType = normalizeTransmission(transmission);
  
  // Map all automatic-like transmissions to 'automatic'
  if (normalizedType === 'automatic' || normalizedType === 'semi-automatic' || normalizedType === 'cvt') {
    return 'automatic';
  }
  
  // Default to manual
  return 'manual';
}
