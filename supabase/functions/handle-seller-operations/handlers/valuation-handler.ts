
/**
 * Changes made:
 * - 2024-07-22: Created dedicated handler for valuation requests
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "../../_shared/index.ts";
import { getValuationFromAPI } from "./valuation-api.ts";

/**
 * Handle valuation request
 */
export async function handleValuationRequest(
  supabase: SupabaseClient,
  data: {
    vin: string;
    mileage: number;
    gearbox: string;
  },
  requestId: string
) {
  logOperation('get_valuation', { requestId, vin: data.vin, mileage: data.mileage });
  return await getValuationFromAPI(data.vin, data.mileage, data.gearbox, requestId);
}
