
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function createVinReservation(supabase: SupabaseClient, vin: string, userId: string) {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 30); // 30 minute reservation

  const { data: reservation, error: reservationError } = await supabase
    .from('vin_reservations')
    .insert({
      vin,
      seller_id: userId,
      expires_at: expirationTime.toISOString(),
    })
    .select()
    .single();

  if (reservationError) {
    console.error('Failed to create VIN reservation:', reservationError);
    throw new Error('Failed to reserve VIN');
  }

  return reservation;
}

export async function checkExistingReservation(supabase: SupabaseClient, vin: string) {
  const { data: existingReservation } = await supabase
    .from('vin_reservations')
    .select('*')
    .eq('vin', vin)
    .eq('status', 'active')
    .single();

  return existingReservation;
}
