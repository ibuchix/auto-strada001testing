
/**
 * Auth hooks index file for easier imports
 * Updated: 2025-06-20 - Fixed circular dependencies by removing direct useAuth export
 * Updated: 2025-06-21 - Added registration exports for backward compatibility
 * Updated: 2025-06-22 - Removed indirect useAuth import to prevent circular dependencies
 * Updated: 2025-06-22 - Exported useAuth from AuthProvider for simpler imports
 */

export * from "./registration";
export * from "./types";
export { useAuth } from "@/components/AuthProvider";

// Explicitly do not export from useAuth.ts to prevent circular dependencies
