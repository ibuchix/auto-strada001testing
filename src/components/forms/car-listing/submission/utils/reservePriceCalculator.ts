
/**
 * Reserve Price Calculator Utility
 * Created: 2025-05-24 - Extracted calculator logic from ReservePriceSection
 */

/**
 * Calculates the reserve price based on the vehicle price
 * 
 * Reserve price calculation formula:
 * PriceX – (PriceX x PercentageY)
 * 
 * Where PriceX = price
 * And PercentageY is determined by price range
 */
export const calculateReservePrice = (price: number): number => {
  let percentage = 0;
  
  // Determine the percentage based on price range
  if (price <= 15000) {
    percentage = 0.65;
  } else if (price <= 20000) {
    percentage = 0.46;
  } else if (price <= 30000) {
    percentage = 0.37;
  } else if (price <= 50000) {
    percentage = 0.27;
  } else if (price <= 60000) {
    percentage = 0.27;
  } else if (price <= 70000) {
    percentage = 0.22;
  } else if (price <= 80000) {
    percentage = 0.23;
  } else if (price <= 100000) {
    percentage = 0.24;
  } else if (price <= 130000) {
    percentage = 0.20;
  } else if (price <= 160000) {
    percentage = 0.185;
  } else if (price <= 200000) {
    percentage = 0.22;
  } else if (price <= 250000) {
    percentage = 0.17;
  } else if (price <= 300000) {
    percentage = 0.18;
  } else if (price <= 400000) {
    percentage = 0.18;
  } else if (price <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145;
  }
  
  // Calculate reserve price using formula: PriceX - (PriceX * PercentageY)
  const reservePrice = Math.round(price - (price * percentage));
  
  return reservePrice;
};
