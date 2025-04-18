// This edge function adds necessary RLS policies to the profiles table
// to ensure users can access their own profile data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from './utils.ts';

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

    // Check existing policies for the profiles table
    const { data: existingPolicies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'profiles' });

    if (policiesError) {
      throw new Error(`Error checking existing policies: ${policiesError.message}`);
    }

    // Define the SQL to add the necessary RLS policies
    let executedSql = [];
    
    // Enable RLS on profiles table if not already enabled
    const { data: rlsStatus, error: rlsStatusError } = await supabase
      .rpc('check_rls_enabled', { table_name: 'profiles' });
      
    if (rlsStatusError) {
      throw new Error(`Error checking RLS status: ${rlsStatusError.message}`);
    }
    
    if (!rlsStatus) {
      // Enable RLS on the profiles table
      const { error: enableRlsError } = await supabase
        .rpc('execute_sql', {
          sql: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'
        });
        
      if (enableRlsError) {
        throw new Error(`Error enabling RLS: ${enableRlsError.message}`);
      }
      
      executedSql.push('Enabled RLS on profiles table');
    }

    // Check if policy exists before creating
    const policyExists = existingPolicies && existingPolicies.some(
      policy => policy.policyname === 'Users can view own profile'
    );

    if (!policyExists) {
      // Add policy for users to view their own profile
      const { error: policyError } = await supabase
        .rpc('execute_sql', {
          sql: `
            CREATE POLICY "Users can view own profile" 
            ON public.profiles 
            FOR SELECT 
            USING (auth.uid() = id);
          `
        });
        
      if (policyError) {
        throw new Error(`Error creating view policy: ${policyError.message}`);
      }
      
      executedSql.push('Created policy: Users can view own profile');
    }

    // Check if update policy exists
    const updatePolicyExists = existingPolicies && existingPolicies.some(
      policy => policy.policyname === 'Users can update own profile'
    );

    if (!updatePolicyExists) {
      // Add policy for users to update their own profile
      const { error: updatePolicyError } = await supabase
        .rpc('execute_sql', {
          sql: `
            CREATE POLICY "Users can update own profile" 
            ON public.profiles 
            FOR UPDATE 
            USING (auth.uid() = id);
          `
        });
        
      if (updatePolicyError) {
        throw new Error(`Error creating update policy: ${updatePolicyError.message}`);
      }
      
      executedSql.push('Created policy: Users can update own profile');
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'RLS policies for profiles table have been set up',
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
    console.error('Error setting up profiles RLS:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to set up profiles RLS policies'
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
