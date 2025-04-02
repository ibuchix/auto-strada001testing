
/**
 * Changes made:
 * - 2024-07-22: Created dedicated handler for VIN reservation requests
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "../../_shared/index.ts";

/**
 * Handle VIN reservation requests
 */
export async function handleReserveVinRequest(
  supabase: SupabaseClient,
  data: {
    vin: string;
    userId: string;
  },
  requestId: string
) {
  // Create a reservation record
  const { data: reservation, error } = await supabase
    .from('vin_reservations')
    .insert({
      vin: data.vin,
      user_id: data.userId,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    })
    .select('id, created_at')
    .single();
    
  if (error) {
    logOperation('reserve_vin_error', { 
      requestId, 
      error: error.message 
    }, 'error');
    
    return {
      success: false,
      error: "Failed to reserve VIN: " + error.message
    };
  }
  
  logOperation('reserve_vin_success', { 
    requestId, 
    reservationId: reservation.id 
  });
  
  return {
    success: true,
    reservationId: reservation.id,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };
}
