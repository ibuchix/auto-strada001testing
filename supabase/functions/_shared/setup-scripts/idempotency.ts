
/**
 * Setup script for idempotency table
 * This script creates the idempotency_keys table if it doesn't exist
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function setupIdempotencyTable() {
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
