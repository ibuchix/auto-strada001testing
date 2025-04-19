
/**
 * Services for setup-profiles-rls edge function
 * Created: 2025-04-19
 */

import { createClient } from '@supabase/supabase-js';
import { RLSPolicy, DBResponse } from './types.ts';

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

  async checkExistingPolicies(tableName: string): Promise<RLSPolicy[]> {
    const { data, error } = await this.supabase
      .rpc('get_policies_for_table', { table_name: tableName });

    if (error) throw new Error(`Error checking existing policies: ${error.message}`);
    return data || [];
  }

  async checkRLSEnabled(tableName: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('check_rls_enabled', { table_name: tableName });
      
    if (error) throw new Error(`Error checking RLS status: ${error.message}`);
    return !!data;
  }

  async executeSQL(sql: string): Promise<DBResponse> {
    return await this.supabase.rpc('execute_sql', { sql });
  }
}

