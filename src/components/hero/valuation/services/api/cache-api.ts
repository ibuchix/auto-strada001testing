
/**
 * Changes made:
 * - 2024-04-04: Fixed parameter format for supabase function calls
 * - 2024-04-04: Added type cast for RPC parameter objects
 * - 2025-04-24: Removed caching mechanism completely
 */

import { supabase } from "@/integrations/supabase/client";
import { generateRequestId } from "./utils/debug-utils";

// These functions have been completely removed as part of cache removal
// Empty implementations are kept to maintain API compatibility

/**
 * Store valuation data in cache - now a no-op as caching is removed
 */
export async function storeValuationInCache(): Promise<boolean> {
  return true;
}

/**
 * Get cached valuation data - now always returns null as caching is removed
 */
export async function getCachedValuation(): Promise<null> {
  return null;
}
