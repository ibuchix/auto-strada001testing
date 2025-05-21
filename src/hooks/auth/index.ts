
/**
 * Auth hooks index file for easier imports
 * Updated: 2025-06-20 - Fixed circular dependencies by removing direct useAuth export
 * Updated: 2025-06-21 - Added registration exports for backward compatibility
 * Updated: 2025-06-22 - Removed indirect useAuth import to prevent circular dependencies
 */

export * from "./registration";
export * from "./types";

// Explicitly do not export from useAuth.ts to prevent circular dependencies
