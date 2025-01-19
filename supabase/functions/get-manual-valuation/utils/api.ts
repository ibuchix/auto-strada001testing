import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

export function calculateChecksum(apiId: string, apiSecret: string, input: string): string {
  const data = `${apiId}${apiSecret}${input}`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(data));
  return encode(new Uint8Array(hash));
}