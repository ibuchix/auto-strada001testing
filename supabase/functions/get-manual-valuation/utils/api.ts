import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

export const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const input = `${apiId}${apiSecret}${vin}`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};