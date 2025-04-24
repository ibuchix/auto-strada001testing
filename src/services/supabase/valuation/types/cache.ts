
/**
 * Type definitions for valuation cache service
 * Created: 2025-04-24
 */

import { Json } from "@/integrations/supabase/types";

export interface CacheOperationResult {
  success: boolean;
  data?: Json;
  error?: string;
}

export interface CacheStorageOptions {
  skipFallbacks?: boolean;
  forceFresh?: boolean;
}

