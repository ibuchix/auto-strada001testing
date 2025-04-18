
/**
 * Changes made:
 * - 2025-04-18: Extracted valuation calculation to dedicated file
 * - 2025-04-18: Added detailed logging of calculation steps
 */

/**
 * Calculate reserve price based on basePrice using the defined percentage tiers
 */
export const calculateReservePrice = (basePrice: number): number => {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    console.error('Invalid base price for reserve calculation:', basePrice);
    return 0;
  }
  
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;
  
  // Calculate and round to the nearest whole number
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  
  console.log('Reserve price calculation:', {
    basePrice,
    percentage: (percentage * 100).toFixed(1) + '%',
    formula: `${basePrice} - (${basePrice} × ${percentage})`,
    reservePrice
  });
  
  return reservePrice;
};
