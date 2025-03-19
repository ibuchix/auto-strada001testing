
/**
 * Changes made:
 * - 2024-12-09: Created types file for realtime functionality
 * - 2024-12-10: Updated RealtimePayload type to be compatible with Supabase payload types
 * - 2024-12-11: Enhanced type safety for payload data access
 */

import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type EnhancedToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  description?: string,
  duration?: number
) => void;

// A union type that can handle all Supabase realtime payload types
export type RealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;
