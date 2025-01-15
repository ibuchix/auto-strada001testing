import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

export function calculateChecksum(apiId: string, apiSecret: string, vin: string): string {
  console.log('Calculating checksum for:', { apiId, vin });
  const input = `${apiId}${apiSecret}${vin}`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return encode(new Uint8Array(hash));
}