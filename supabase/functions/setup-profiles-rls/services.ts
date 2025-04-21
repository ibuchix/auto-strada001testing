
/**
 * Services for setup-profiles-rls edge function
 * Updated: 2025-04-19 - Improved error handling and service reliability
 * 2025-04-21: Fixed supabase-js import to use Deno/ESM compatible style for edge functions.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'; // Fixed to use CDN import for Deno compatibility
import { RLSPolicy, DBResponse } from './types.ts';
import { logError } from './utils/logging.ts';

export class RLSService {
  private supabase;

  constructor() {
    try {
      this.supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        {
          auth: { persistSession: false },
          db: { schema: 'public' }
        }
      );
    } catch (error) {
      logError('RLSService.constructor', error as Error);
      throw new Error(`Failed to initialize Supabase client: ${(error as Error).message}`);
    }
  }

  async checkExistingPolicies(tableName: string): Promise<RLSPolicy[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_policies_for_table', { table_name: tableName });

      if (error) throw new Error(`Error checking existing policies: ${error.message}`);
      return data || [];
    } catch (error) {
      logError('RLSService.checkExistingPolicies', error as Error, { tableName });
      throw error;
    }
  }

  async checkRLSEnabled(tableName: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_rls_enabled', { table_name: tableName });
        
      if (error) throw new Error(`Error checking RLS status: ${error.message}`);
      return !!data;
    } catch (error) {
      logError('RLSService.checkRLSEnabled', error as Error, { tableName });
      throw error;
    }
  }

  async executeSQL(sql: string): Promise<DBResponse> {
    try {
      return await this.supabase.rpc('execute_sql', { sql });
    } catch (error) {
      logError('RLSService.executeSQL', error as Error, { 
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : '') 
      });
      throw error;
    }
  }
}

