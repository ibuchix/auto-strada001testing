import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";
import { ManualValuationRequest } from '../types/validation.ts';

export function calculateChecksum(apiId: string, apiSecret: string, make: string, model: string): string {
  const input = `${apiId}${apiSecret}${make}${model}`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return encode(new Uint8Array(hash));
}

export async function fetchValuation(
  apiId: string, 
  checksum: string, 
  data: ManualValuationRequest
): Promise<Response> {
  const url = `https://bp.autoiso.pl/api/v3/getManualValuation/apiuid:${apiId}/checksum:${checksum}/make:${encodeURIComponent(data.make)}/model:${encodeURIComponent(data.model)}/year:${data.year}/odometer:${data.mileage}/transmission:${data.transmission}/currency:PLN/country:${data.country}/fuel:${data.fuel}`;
  
  console.log('Making API request to:', url);
  return await fetch(url);
}