
/**
 * Cache service for handle-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from './logging.ts';

/**
 * Store VIN search result in the database
 * @param supabaseUrl Supabase URL
 * @param supabaseKey Supabase service role key
 * @param vin Vehicle identification number
 * @param valuationData Valuation data
 * @param userId User ID if authenticated
 * @param requestId Request ID for tracking
 */
export async function storeSearchResult(
  supabaseUrl: string,
  supabaseKey: string,
  vin: string,
  valuationData: any,
  userId: string | null,
  requestId: string
): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    logOperation('missing_db_credentials', { requestId }, 'error');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase
      .from('vin_search_results')
      .insert({
        vin,
        search_data: valuationData,
        user_id: userId
      });
    
    if (error) {
      logOperation('cache_store_error', { 
        requestId, 
        error: error.message 
      }, 'error');
    } else {
      logOperation('cache_store_success', { requestId }, 'debug');
    }
  } catch (error) {
    logOperation('cache_store_exception', { 
      requestId, 
      error: (error as Error).message 
    }, 'error');
  }
}
