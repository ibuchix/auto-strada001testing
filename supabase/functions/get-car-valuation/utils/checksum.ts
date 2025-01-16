export function calculateChecksum(apiId: string, apiSecret: string, vin: string): string {
  console.log('Calculating checksum for:', { apiId, vin });
  const input = `${apiId}${apiSecret}${vin}`;
  
  // Convert string to Uint8Array for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Calculate MD5 hash
  const hashBuffer = crypto.subtle.digestSync('MD5', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Calculated checksum:', checksum);
  return checksum;
}