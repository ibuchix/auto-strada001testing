import { createHash } from "https://deno.land/std@0.177.0/hash/mod.ts"

export function calculateChecksum(apiId: string, apiSecret: string, value: string): string {
  const input = apiId + apiSecret + value
  return createHash('md5').update(input).toString()
}