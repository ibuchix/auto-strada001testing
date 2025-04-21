
/**
 * Services for setup-cars-rls edge function
 * Created: 2025-04-19
 * 2025-04-21: Fixed supabase-js import to use Deno/ESM compatible style for edge functions and modular utils.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'; // Fixed: Use CDN import for Deno compatibility
import { RLSPolicy, DBResponse } from './types.ts';
import { logOperation, logError } from './utils.ts';

export class RLSService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );
  }

  /**
   * Check existing policies for a table
   * @param tableName The table to check
   * @returns Array of existing policies
   */
  async checkExistingPolicies(tableName: string): Promise<RLSPolicy[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_policies_for_table', { table_name: tableName });

      if (error) throw new Error(`Error checking existing policies: ${error.message}`);
      
      logOperation('check_existing_policies', { 
        tableName, 
        policiesFound: data?.length || 0 
      });
      
      return data || [];
    } catch (error) {
      logError('check_existing_policies', error as Error, { tableName });
      throw error;
    }
  }

  /**
   * Check if RLS is enabled for a table
   * @param tableName The table to check
   * @returns Boolean indicating if RLS is enabled
   */
  async checkRLSEnabled(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_rls_enabled', { table_name: tableName });
        
      if (error) throw new Error(`Error checking RLS status: ${error.message}`);
      
      logOperation('check_rls_enabled', { 
        tableName, 
        isEnabled: !!data 
      });
      
      return !!data;
    } catch (error) {
      logError('check_rls_enabled', error as Error, { tableName });
      throw error;
    }
  }

  /**
   * Execute SQL statement
   * @param sql SQL statement to execute
   * @returns Database response
   */
  async executeSQL(sql: string): Promise<DBResponse> {
    try {
      const response = await this.supabase.rpc('execute_sql', { sql });
      
      logOperation('execute_sql', { 
        success: !response.error,
        errorMessage: response.error?.message
      });
      
      return response;
    } catch (error) {
      logError('execute_sql', error as Error);
      throw error;
    }
  }
}
