
/**
 * Testing utility for reserve prices
 * Created: 2025-05-18 - Added for one-off verification tests
 */

import { validateReservePrice } from "./reservePriceValidator";
import { calculateReservePrice } from "./reservePriceCalculator";

/**
 * Tests a specific VIN's valuation data
 */
export function testAudiA4Valuation() {
  // Based on the valuation data from console logs:
  const basePrice = 35824; // This is what's in the API response
  const displayedReservePrice = 26868; // From the UI
  
  // Validate with our pricing rules
  const validation = validateReservePrice(basePrice, displayedReservePrice);
  
  // Log results
  console.log("Reserve Price Verification for VIN: WAUZZZ8K79A090954 (2008 AUDI A4)");
  console.log("--------------------------------------------------------------");
  console.log(`Base Price: ${basePrice} PLN`);
  console.log(`Price Tier: ${validation.priceTier} (${validation.appliedPercentage}% discount)`);
  console.log(`Expected Reserve Price: ${validation.expectedReservePrice} PLN`);
  console.log(`Displayed Reserve Price: ${displayedReservePrice} PLN`);
  console.log(`Discrepancy: ${validation.discrepancy} PLN (${validation.discrepancyPercent.toFixed(2)}%)`);
  console.log(`Is Valid: ${validation.isValid ? "YES ✓" : "NO ✗"}`);
  console.log("--------------------------------------------------------------");
  
  return validation;
}
