import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

export function calculateChecksum(apiId: string, apiSecret: string, value: string): string {
  const input = apiId + apiSecret + value;
  const hash = crypto.subtle.digestSync(
    "MD5",
    new TextEncoder().encode(input)
  );
  return encode(hash);
}