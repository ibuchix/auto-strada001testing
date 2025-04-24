
/**
 * Logging utilities for valuation cache service
 * Created: 2025-04-24
 */

import { Json } from "@/integrations/supabase/types";

interface DataStructureLog {
  hasData: boolean;
  topLevelKeys: string[];
  hasPriceFields?: boolean;
  hasValuation?: boolean;
  hasVehicleInfo?: boolean;
  timestamp?: string;
}

export function logDataStructure(data: Json | null): DataStructureLog {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      hasData: false,
      topLevelKeys: []
    };
  }

  return {
    hasData: true,
    topLevelKeys: Object.keys(data),
    hasPriceFields: !!(data.price_min || data.price_med),
    hasValuation: !!data.valuation,
    hasVehicleInfo: !!(data.make && data.model)
  };
}

export function logCacheOperation(operation: string, details: Record<string, any>) {
  console.log(`Cache ${operation}:`, details);
}

