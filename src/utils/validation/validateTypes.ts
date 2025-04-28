
/**
 * Utility functions for validation and normalization of common types
 * Created: 2025-04-28
 */

/**
 * Normalizes transmission type input to standard values
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
