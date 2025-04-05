
/**
 * Calculate the reserve price based on base price using the tiered percentage formula
 * 
 * @param basePrice The base price used for calculation
 * @param requestId For logging
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number, requestId?: string): number {
  let percentageY: number;
  
  // Determine percentage based on price range
  if (basePrice <= 15000) percentageY = 0.65;
  else if (basePrice <= 20000) percentageY = 0.46;
  else if (basePrice <= 30000) percentageY = 0.37;
  else if (basePrice <= 50000) percentageY = 0.27;
  else if (basePrice <= 60000) percentageY = 0.27;
  else if (basePrice <= 70000) percentageY = 0.22;
  else if (basePrice <= 80000) percentageY = 0.23;
  else if (basePrice <= 100000) percentageY = 0.24;
  else if (basePrice <= 130000) percentageY = 0.20;
  else if (basePrice <= 160000) percentageY = 0.185;
  else if (basePrice <= 200000) percentageY = 0.22;
  else if (basePrice <= 250000) percentageY = 0.17;
  else if (basePrice <= 300000) percentageY = 0.18;
  else if (basePrice <= 400000) percentageY = 0.18;
  else if (basePrice <= 500000) percentageY = 0.16;
  else percentageY = 0.145;
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentageY));
  
  if (requestId) {
    console.log(`[${requestId}] Calculated reserve price:`, { 
      basePrice, 
      percentageY, 
      reservePrice 
    });
  }
  
  return reservePrice;
}
