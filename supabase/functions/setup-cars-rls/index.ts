
// This edge function adds necessary RLS policies to the cars table
// to ensure sellers can access their own car listings data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../handle-seller-operations/utils.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    // Check existing policies for the cars table
    const { data: existingPolicies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'cars' });

    if (policiesError) {
      throw new Error(`Error checking existing policies: ${policiesError.message}`);
    }

    // Define the SQL to add the necessary RLS policies
    let executedSql = [];
    
    // Enable RLS on cars table if not already enabled
    const { data: rlsStatus, error: rlsStatusError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'cars' });
      
    if (rlsStatusError) {
      throw new Error(`Error checking RLS status: ${rlsStatusError.message}`);
    }
    
    if (!rlsStatus) {
      // Enable RLS on the cars table
      const { error: enableRlsError } = await supabase
        .rpc('execute_sql', {
          sql: 'ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;'
        });
        
      if (enableRlsError) {
        throw new Error(`Error enabling RLS: ${enableRlsError.message}`);
      }
      
      executedSql.push('Enabled RLS on cars table');
    }

    // Create policy for sellers to view their own listings
    const viewPolicyExists = existingPolicies && existingPolicies.some(
      policy => policy.policyname === 'Sellers can view own listings'
    );

    if (!viewPolicyExists) {
      const { error: viewPolicyError } = await supabase
        .rpc('execute_sql', {
          sql: `
            CREATE POLICY "Sellers can view own listings" 
            ON public.cars 
            FOR SELECT 
            USING (auth.uid() = seller_id);
          `
        });
        
      if (viewPolicyError) {
        throw new Error(`Error creating view policy: ${viewPolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can view own listings');
    }

    // Create policy for sellers to insert their own listings
    const insertPolicyExists = existingPolicies && existingPolicies.some(
      policy => policy.policyname === 'Sellers can insert own listings'
    );

    if (!insertPolicyExists) {
      const { error: insertPolicyError } = await supabase
        .rpc('execute_sql', {
          sql: `
            CREATE POLICY "Sellers can insert own listings" 
            ON public.cars 
            FOR INSERT 
            WITH CHECK (auth.uid() = seller_id);
          `
        });
        
      if (insertPolicyError) {
        throw new Error(`Error creating insert policy: ${insertPolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can insert own listings');
    }

    // Create policy for sellers to update their own listings
    const updatePolicyExists = existingPolicies && existingPolicies.some(
      policy => policy.policyname === 'Sellers can update own listings'
    );

    if (!updatePolicyExists) {
      const { error: updatePolicyError } = await supabase
        .rpc('execute_sql', {
          sql: `
            CREATE POLICY "Sellers can update own listings" 
            ON public.cars 
            FOR UPDATE 
            USING (auth.uid() = seller_id);
          `
        });
        
      if (updatePolicyError) {
        throw new Error(`Error creating update policy: ${updatePolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can update own listings');
    }

    // Create policy for sellers to delete their own listings
    const deletePolicyExists = existingPolicies && existingPolicies.some(
      policy => policy.policyname === 'Sellers can delete own listings'
    );

    if (!deletePolicyExists) {
      const { error: deletePolicyError } = await supabase
        .rpc('execute_sql', {
          sql: `
            CREATE POLICY "Sellers can delete own listings" 
            ON public.cars 
            FOR DELETE 
            USING (auth.uid() = seller_id);
          `
        });
        
      if (deletePolicyError) {
        throw new Error(`Error creating delete policy: ${deletePolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can delete own listings');
    }

    // Create a secure function for fetching seller listings if it doesn't exist
    const { error: createFunctionError } = await supabase
      .rpc('execute_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.get_seller_listings(p_seller_id uuid)
          RETURNS SETOF public.cars
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT * FROM public.cars
            WHERE seller_id = p_seller_id;
          END;
          $$;
        `
      });
      
    if (createFunctionError) {
      throw new Error(`Error creating security definer function: ${createFunctionError.message}`);
    }
    
    executedSql.push('Created or updated security definer function: get_seller_listings');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'RLS policies for cars table have been set up',
        executed: executedSql
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error setting up cars RLS:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to set up cars RLS policies'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
