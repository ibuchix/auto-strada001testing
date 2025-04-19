
/**
 * Edge function to setup RLS policies for profiles table
 * Updated: 2025-04-19 - Restructured with improved error handling and utility organization
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RLSService } from './services.ts';
import { 
  corsHeaders, 
  handleOptions, 
  formatResponse, 
  formatErrorResponse,
  logOperation,
  logError,
  validateEnvironment
} from './utils/index.ts';
import type { ProfilesRLSResult } from './types.ts';

serve(async (req) => {
  const requestId = crypto.randomUUID();
  logOperation('setup_profiles_rls_start', { requestId });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  try {
    // Validate required environment variables
    validateEnvironment();
    
    const rlsService = new RLSService();
    const executedSql: string[] = [];
    
    // Check RLS status
    const rlsEnabled = await rlsService.checkRLSEnabled('profiles');
    
    // Enable RLS if not already enabled
    if (!rlsEnabled) {
      const { error: enableRlsError } = await rlsService.executeSQL(
        'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'
      );
      
      if (enableRlsError) {
        throw new Error(`Error enabling RLS: ${enableRlsError.message}`);
      }
      
      executedSql.push('Enabled RLS on profiles table');
      logOperation('enabled_rls', { table: 'profiles', requestId });
    }

    // Check existing policies
    const existingPolicies = await rlsService.checkExistingPolicies('profiles');

    // Add view policy if needed
    if (!existingPolicies.some(policy => policy.policyname === 'Users can view own profile')) {
      const { error: viewPolicyError } = await rlsService.executeSQL(`
        CREATE POLICY "Users can view own profile" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = id);
      `);
      
      if (viewPolicyError) {
        throw new Error(`Error creating view policy: ${viewPolicyError.message}`);
      }
      
      executedSql.push('Created policy: Users can view own profile');
      logOperation('created_policy', { 
        policy: 'Users can view own profile', 
        table: 'profiles',
        requestId 
      });
    }

    // Add update policy if needed
    if (!existingPolicies.some(policy => policy.policyname === 'Users can update own profile')) {
      const { error: updatePolicyError } = await rlsService.executeSQL(`
        CREATE POLICY "Users can update own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
      `);
      
      if (updatePolicyError) {
        throw new Error(`Error creating update policy: ${updatePolicyError.message}`);
      }
      
      executedSql.push('Created policy: Users can update own profile');
      logOperation('created_policy', { 
        policy: 'Users can update own profile', 
        table: 'profiles',
        requestId 
      });
    }

    const result: ProfilesRLSResult = {
      success: true,
      message: 'RLS policies for profiles table have been set up',
      executed: executedSql
    };

    logOperation('setup_profiles_rls_complete', { 
      success: true, 
      policiesCreated: executedSql.length,
      requestId
    });

    return formatResponse(result);
  } catch (error) {
    logError('setup_profiles_rls', error as Error, { requestId });
    return formatErrorResponse(error as Error);
  }
});
