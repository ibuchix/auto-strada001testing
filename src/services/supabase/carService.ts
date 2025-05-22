
/**
 * Car Service
 * Updated: 2025-05-23 - Fixed TypeScript compatibility with Supabase Json types
 */

import { supabase } from '@/integrations/supabase/client';
import { toSupabaseObject, safeJsonCast } from '@/utils/supabaseTypeUtils';

/**
 * Fetches a car by ID
 */
export async function fetchCarById(carId: string) {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', carId)
      .single();
    
    if (error) {
      console.error('Error fetching car:', error);
      return { error };
    }
    
    return { data };
  } catch (error) {
    console.error('Exception fetching car:', error);
    return { error };
  }
}

/**
 * Updates a car record
 */
export async function updateCar(carId: string, updateData: Record<string, any>) {
  try {
    // Convert to database compatible format
    const supabaseData = toSupabaseObject({
      ...updateData,
      updated_at: new Date().toISOString()
    });
    
    const { data, error } = await supabase
      .from('cars')
      .update(supabaseData)
      .eq('id', carId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating car:', error);
      return { error };
    }
    
    return { data };
  } catch (error) {
    console.error('Exception updating car:', error);
    return { error };
  }
}

/**
 * Fetches car ownership history
 */
export async function fetchCarOwnershipHistory(carId: string) {
  try {
    const { data, error } = await supabase.rpc('get_car_ownership_history', {
      p_car_id: carId
    });
    
    if (error) {
      console.error('Error fetching car ownership history:', error);
      return { error };
    }
    
    return { data: safeJsonCast(data) };
  } catch (error) {
    console.error('Exception fetching car ownership history:', error);
    return { error };
  }
}

/**
 * Fetches car details
 */
export async function fetchCarDetails(carId: string) {
  try {
    const { data, error } = await supabase.rpc('fetch_car_details', {
      p_car_id: carId
    });
    
    if (error) {
      console.error('Error fetching car details:', error);
      return { error };
    }
    
    return { data: safeJsonCast(data) };
  } catch (error) {
    console.error('Exception fetching car details:', error);
    return { error };
  }
}
