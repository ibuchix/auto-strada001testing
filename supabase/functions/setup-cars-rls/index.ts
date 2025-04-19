
/**
 * Edge function to setup RLS policies for cars table
 * Updated: 2025-04-19 - Restructured to use modular architecture
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RLSService } from './services.ts';
import { corsHeaders, formatSuccessResponse, formatErrorResponse, logOperation, logError } from './utils.ts';
import type { CarsRLSResult } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  logOperation('setup_cars_rls_start', { requestId });

  try {
    const rlsService = new RLSService();
    const executedSql: string[] = [];
    
    // Check RLS status
    const rlsEnabled = await rlsService.checkRLSEnabled('cars');
    
    // Enable RLS if not already enabled
    if (!rlsEnabled) {
      const { error: enableRlsError } = await rlsService.executeSQL(
        'ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;'
      );
      
      if (enableRlsError) {
        throw new Error(`Error enabling RLS: ${enableRlsError.message}`);
      }
      
      executedSql.push('Enabled RLS on cars table');
    }

    // Check existing policies
    const existingPolicies = await rlsService.checkExistingPolicies('cars');

    // Create policy for sellers to view their own listings
    if (!existingPolicies.some(policy => policy.policyname === 'Sellers can view own listings')) {
      const { error: viewPolicyError } = await rlsService.executeSQL(`
        CREATE POLICY "Sellers can view own listings" 
        ON public.cars 
        FOR SELECT 
        USING (auth.uid() = seller_id);
      `);
      
      if (viewPolicyError) {
        throw new Error(`Error creating view policy: ${viewPolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can view own listings');
    }

    // Create policy for sellers to insert their own listings
    if (!existingPolicies.some(policy => policy.policyname === 'Sellers can insert own listings')) {
      const { error: insertPolicyError } = await rlsService.executeSQL(`
        CREATE POLICY "Sellers can insert own listings" 
        ON public.cars 
        FOR INSERT 
        WITH CHECK (auth.uid() = seller_id);
      `);
      
      if (insertPolicyError) {
        throw new Error(`Error creating insert policy: ${insertPolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can insert own listings');
    }

    // Create policy for sellers to update their own listings
    if (!existingPolicies.some(policy => policy.policyname === 'Sellers can update own listings')) {
      const { error: updatePolicyError } = await rlsService.executeSQL(`
        CREATE POLICY "Sellers can update own listings" 
        ON public.cars 
        FOR UPDATE 
        USING (auth.uid() = seller_id);
      `);
      
      if (updatePolicyError) {
        throw new Error(`Error creating update policy: ${updatePolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can update own listings');
    }

    // Create policy for sellers to delete their own listings
    if (!existingPolicies.some(policy => policy.policyname === 'Sellers can delete own listings')) {
      const { error: deletePolicyError } = await rlsService.executeSQL(`
        CREATE POLICY "Sellers can delete own listings" 
        ON public.cars 
        FOR DELETE 
        USING (auth.uid() = seller_id);
      `);
      
      if (deletePolicyError) {
        throw new Error(`Error creating delete policy: ${deletePolicyError.message}`);
      }
      
      executedSql.push('Created policy: Sellers can delete own listings');
    }

    // Create a secure function for fetching seller listings if it doesn't exist
    const { error: createFunctionError } = await rlsService.executeSQL(`
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
    `);
    
    if (createFunctionError) {
      throw new Error(`Error creating security definer function: ${createFunctionError.message}`);
    }
    
    executedSql.push('Created or updated security definer function: get_seller_listings');

    const result: CarsRLSResult = {
      success: true,
      message: 'RLS policies for cars table have been set up',
      executed: executedSql
    };

    logOperation('setup_cars_rls_complete', { 
      requestId,
      success: true,
      policiesCreated: executedSql.length
    });

    return formatSuccessResponse(result);
  } catch (error) {
    logError('setup_cars_rls', error as Error, { requestId });
    return formatErrorResponse(error as Error);
  }
});
