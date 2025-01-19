import { createHash } from "https://deno.land/std@0.177.0/hash/mod.ts";

export const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const input = `${apiId}${apiSecret}${vin}`;
  return createHash("md5").update(input).toString();
};