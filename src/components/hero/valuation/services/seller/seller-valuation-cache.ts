
/**
 * Changes made:
 * - 2025-04-24: Removed caching mechanism to ensure direct API calls
 */

export async function getSellerValuationCache(): Promise<any | null> {
  // Caching disabled - always return null to force API call
  return null;
}

export async function storeSellerValuationCache(): Promise<void> {
  // Caching disabled - no storage needed
  return;
}
