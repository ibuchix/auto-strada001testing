
/**
 * Type definitions for setup-profiles-rls
 * Updated: 2025-04-19 - Added additional types for improved type safety
 */

export interface RLSPolicy {
  policyname: string;
  tablename: string;
  schemaname: string;
  cmd: string;
  roles: string[];
  qual: string;
  with_check: string;
}

export interface DBResponse {
  data: any;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
}

export interface ProfilesRLSResult {
  success: boolean;
  message: string;
  executed: string[];
  timestamp?: string;
  errors?: string[];
}
