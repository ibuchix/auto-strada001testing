
/**
 * Changes made:
 * - 2024-03-19: Added reserve price calculation logic
 * - 2024-03-19: Updated reserve price calculation to use correct formula and percentage tiers
 * - 2024-06-15: Updated API credentials and checksum calculation
 * - 2024-06-17: Fixed hash import to use crypto module instead of deprecated hash module
 * - 2024-06-17: Properly implemented MD5 calculation using crypto module
 * - 2024-06-17: Added processProxyBids function to handle automated bidding
 * - 2024-06-19: Refactored to use database function for reserve price calculation
 * - 2024-06-22: Refactored into separate modules for better organization
 */

// Export the functions from their respective modules
export { validateVin } from './vin-validation.ts';
export { processProxyBids } from './proxy-bids.ts';
