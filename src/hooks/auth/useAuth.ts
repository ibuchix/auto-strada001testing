
/**
 * Changes made:
 * - 2024-12-30: Refactored from original useAuth.tsx into smaller focused hooks
 * - 2024-12-30: Now serves as the main entry point that composes various auth hooks
 * - 2025-06-20: Renamed to avoid circular dependencies, no longer exported directly
 */

import { useState } from "react";
import { useSellerRegistration } from "./useSellerRegistration";

/**
 * Main authentication hook that composes various auth-related hooks
 * This is for internal use only - components should use useAuth from AuthProvider
 */
export const useAuthComposition = () => {
  const { isLoading: isSellerRegistrationLoading, registerSeller } = useSellerRegistration();
  const [isLoading, setIsLoading] = useState(false);

  return {
    isLoading: isLoading || isSellerRegistrationLoading,
    registerSeller
  };
};
