
/**
 * Reservation checking functionality
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export async function checkExistingReservation(
  supabase: SupabaseClient, 
  vin: string, 
  userId: string
) {
  if (!userId) return { valid: false, error: 'User ID is required to check reservations' };
  
  const { data: reservation, error } = await supabase
    .from('vin_reservations')
    .select('*')
    .eq('vin', vin)
    .eq('status', 'active')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    return { valid: false, error: `Error checking reservation: ${error.message}` };
  }
  
  if (!reservation) {
    return { valid: false, error: 'No active reservation found' };
  }
  
  const now = new Date();
  const expiresAt = new Date(reservation.expires_at);
  
  if (now > expiresAt) {
    return { valid: false, error: 'Reservation has expired' };
  }
  
  return { valid: true, reservation };
}
