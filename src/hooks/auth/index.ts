
/**
 * Auth hooks index file for easier imports
 * Updated: 2025-06-20 - Fixed circular dependencies by removing direct useAuth export
 */

export * from "./registration";
export * from "./types";

// No longer exporting from "./useAuth" to prevent circular dependencies
