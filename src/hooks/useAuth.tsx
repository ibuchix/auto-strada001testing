
/**
 * Changes made:
 * - 2024-03-28: Created useAuth hook to handle authentication logic
 * - 2024-03-29: Updated type definitions to ensure consistency with form data
 * - 2024-03-31: Fixed DealerData type to make all fields required
 * - 2024-04-01: Fixed type mismatch between DealerData and form submission
 * - 2024-06-24: Added registerSeller function for seller registration
 * - 2024-06-25: Fixed registerSeller implementation to properly update user role
 * - 2024-06-28: Removed dealer-specific functionality to make app seller-specific
 * - 2024-07-05: Updated registerSeller to use the database function for more reliable registration
 * - 2024-07-06: Enhanced error handling and added better validation for seller registration
 * - 2024-12-18: Improved registerSeller with progressive fallback methods for robustness
 * - 2024-12-22: Added debug logging and improved profiles update logic
 * - 2024-12-28: Completely overhauled registerSeller with enhanced error handling, retry mechanisms, and recovery
 * - 2024-12-30: Refactored into smaller files for better maintainability
 * - 2025-06-07: Fixed circular dependency by exporting directly from auth index
 * - 2025-06-20: Fixed circular imports by making this a direct import from AuthProvider
 * - 2025-06-21: Removed file content to prevent circular dependency issues
 * - 2025-06-22: Simplified import to directly use the AuthProvider
 * - 2025-05-30: Fixed module loading error by using direct import from AuthProvider
 */

// This file directly re-exports from AuthProvider to prevent circular dependencies
export { useAuth } from "@/components/AuthProvider";
