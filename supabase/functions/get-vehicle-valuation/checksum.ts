
/**
 * Checksum calculation utilities for vehicle valuation
 * This file is intentionally kept separate but no longer used in the index.ts
 * to consolidate all imports in the main edge function file.
 */

import { md5 } from "https://deno.land/std@0.187.0/hash/md5.ts";

export const calculateValuationChecksum = async (apiId: string, apiSecret: string, vin: string): Promise<string> => {
  const checksumContent = apiId + apiSecret + vin;
  return md5.toString(new TextEncoder().encode(checksumContent));
};
