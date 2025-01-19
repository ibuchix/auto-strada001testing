import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

export const calculateChecksum = (apiId: string, apiSecret: string, input: string): string => {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(`${apiId}${apiSecret}${input}`);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};