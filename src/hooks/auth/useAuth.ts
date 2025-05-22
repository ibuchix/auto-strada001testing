
/**
 * Changes made:
 * - 2024-12-30: Refactored from original useAuth.tsx into smaller focused hooks
 * - 2024-12-30: Now serves as the main entry point that composes various auth hooks
 * - 2025-06-20: Renamed to avoid circular dependencies, no longer exported directly
 * - 2025-06-21: Removed file content to prevent circular dependency issues
 * - 2025-05-30: Fixed module import issues by properly exporting from AuthProvider
 */

// Direct re-export from AuthProvider to avoid circular dependencies
export { useAuth } from "@/components/AuthProvider";
