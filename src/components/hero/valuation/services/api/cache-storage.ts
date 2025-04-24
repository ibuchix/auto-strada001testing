
/**
 * Changes made:
 * - 2024-04-15: Initial implementation of cache storage service
 * - 2025-04-24: Disabled caching to ensure direct API calls
 */

export const storeValuationInCache = async (): Promise<boolean> => {
  // Caching disabled - always return true to not block main flow
  return true;
};

export const getValuationFromCache = async (): Promise<any | null> => {
  // Caching disabled - always return null to force API call
  return null;
};
