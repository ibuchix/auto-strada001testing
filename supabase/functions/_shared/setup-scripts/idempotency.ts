
/**
 * Setup script for idempotency table
 * This script creates the idempotency_keys table if it doesn't exist
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface IdempotencyKey {
  key: string;
  request_path: string;
  user_id?: string;
  created_at: string;
  used_at?: string;
  status: 'processing' | 'completed' | 'failed';
  response_data?: unknown;
}

export async function setupIdempotencyTable(): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );
    
    // Check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('idempotency_keys')
      .select('key')
      .limit(1);
    
    // If no error, table exists
    if (!checkError) {
      console.log('Idempotency keys table already exists, skipping creation');
      return;
    }
    
    // Create the table using SQL query
    const { error: createError } = await supabase.rpc('create_idempotency_keys_table');
    
    if (createError) {
      console.error('Error creating idempotency_keys table:', createError);
      
      // If RPC doesn't exist, we need to create it
      // This is a one-time operation you should run manually
      console.log('Creating RPC function for idempotency table setup...');
      
      // Create the RPC function that will create the table
      const { error: rpcError } = await supabase.rpc('create_idempotency_setup_function');
      
      if (rpcError) {
        console.error('Could not create setup function:', rpcError);
        return;
      }
      
      // Try again with the newly created function
      const { error: retryError } = await supabase.rpc('create_idempotency_keys_table');
      if (retryError) {
        console.error('Failed to create idempotency_keys table after creating function:', retryError);
      } else {
        console.log('Successfully created idempotency_keys table');
      }
    } else {
      console.log('Successfully created idempotency_keys table');
    }
  } catch (error) {
    console.error('Unexpected error setting up idempotency table:', error);
  }
}

/**
 * Check if a request with this idempotency key has been processed
 */
export async function checkIdempotencyKey(
  supabase: SupabaseClient,
  key: string,
  path: string
): Promise<{ exists: boolean; status: string; data?: unknown }> {
  try {
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('*')
      .eq('key', key)
      .eq('request_path', path)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking idempotency key:', error);
      return { exists: false, status: 'error' };
    }
    
    if (!data) {
      return { exists: false, status: 'new' };
    }
    
    return { 
      exists: true, 
      status: data.status,
      data: data.response_data 
    };
  } catch (error) {
    console.error('Exception checking idempotency key:', error);
    return { exists: false, status: 'error' };
  }
}

/**
 * Store a new idempotency key record
 */
export async function recordIdempotencyRequest(
  supabase: SupabaseClient,
  key: string,
  path: string,
  userId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('idempotency_keys')
      .insert({
        key,
        request_path: path,
        user_id: userId,
        created_at: new Date().toISOString(),
        status: 'processing',
      });
    
    if (error) {
      console.error('Error recording idempotency key:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception recording idempotency key:', error);
    return false;
  }
}

/**
 * Update an idempotency key record with the response
 */
export async function updateIdempotencyRecord(
  supabase: SupabaseClient,
  key: string,
  status: 'completed' | 'failed',
  responseData?: unknown
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('idempotency_keys')
      .update({
        status,
        used_at: new Date().toISOString(),
        response_data: responseData
      })
      .eq('key', key);
    
    if (error) {
      console.error('Error updating idempotency key:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating idempotency key:', error);
    return false;
  }
}
