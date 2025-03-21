
/**
 * Changes made:
 * - 2024-08-01: Created caching API for valuation results
 * - 2024-08-02: Fixed type issues with ValuationData
 * - 2024-12-31: Updated to use security definer function for reliable caching
 * - 2025-03-21: Fixed TypeScript error with onConflict method
 * - 2025-04-22: Enhanced error handling and added anonymous access for caching
 * - 2025-04-23: Improved security definer function interaction with detailed logging
 * - 2025-04-24: Fixed TypeScript error with p_log_id parameter
 * - 2025-04-25: Fixed TypeScript error with RPC function parameter types
 * - 2025-04-26: Added comprehensive debug logging for authentication and error tracking
 * - 2025-04-27: Refactored into smaller modules for better maintainability
 * - 2025-04-28: Fixed export method name mismatches to ensure proper type compatibility
 * - 2025-05-01: Fixed import/export name inconsistencies
 */

// Re-export the functionality from the specialized modules
export { getCachedValuation } from './cache-retrieval';
export { storeValuationInCache } from './cache-storage';
