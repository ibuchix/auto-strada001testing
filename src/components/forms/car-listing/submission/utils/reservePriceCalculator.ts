
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for reserve price calculations
 */

/**
 * Calculates reserve price based on the base price and percentage tier
 * @param priceX The base vehicle price
 * @returns The calculated reserve price
 */
export const calculateReservePrice = (priceX: number): number => {
  let percentageY: number;

  // Determine appropriate percentage based on price tier
  if (priceX <= 15000) {
    percentageY = 0.65;
  } else if (priceX <= 20000) {
    percentageY = 0.46;
  } else if (priceX <= 30000) {
    percentageY = 0.37;
  } else if (priceX <= 50000) {
    percentageY = 0.27;
  } else if (priceX <= 60000) {
    percentageY = 0.27;
  } else if (priceX <= 70000) {
    percentageY = 0.22;
  } else if (priceX <= 80000) {
    percentageY = 0.23;
  } else if (priceX <= 100000) {
    percentageY = 0.24;
  } else if (priceX <= 130000) {
    percentageY = 0.20;
  } else if (priceX <= 160000) {
    percentageY = 0.185;
  } else if (priceX <= 200000) {
    percentageY = 0.22;
  } else if (priceX <= 250000) {
    percentageY = 0.17;
  } else if (priceX <= 300000) {
    percentageY = 0.18;
  } else if (priceX <= 400000) {
    percentageY = 0.18;
  } else if (priceX <= 500000) {
    percentageY = 0.16;
  } else {
    percentageY = 0.145;
  }

  // Calculate reserve price: PriceX - (PriceX * PercentageY)
  return priceX - (priceX * percentageY);
};
