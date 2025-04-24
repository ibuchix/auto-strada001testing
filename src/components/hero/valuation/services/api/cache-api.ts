
/**
 * Changes made:
 * - 2024-04-04: Fixed parameter format for supabase function calls
 * - 2024-04-04: Added type cast for RPC parameter objects
 */

import { supabase } from "@/integrations/supabase/client";
import { generateRequestId } from "./utils/debug-utils";

/**
 * Store valuation data in cache
 */
export async function storeValuationInCache(vin: string, mileage: number, data: any) {
  // Caching disabled - always return true to not block main flow
  return true;
}

/**
 * Get cached valuation data
 */
export async function getCachedValuation(vin: string, mileage: number) {
  // Caching disabled - always return null to force API call
  return null;
}
