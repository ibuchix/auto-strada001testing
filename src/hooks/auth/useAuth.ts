
/**
 * Changes made:
 * - 2024-12-30: Refactored from original useAuth.tsx into smaller focused hooks
 * - 2024-12-30: Now serves as the main entry point that composes various auth hooks
 */

import { useState } from "react";
import { useSellerRegistration } from "./useSellerRegistration";

/**
 * Main authentication hook that composes various auth-related hooks
 */
export const useAuthActions = () => {
  const { isLoading: isSellerRegistrationLoading, registerSeller } = useSellerRegistration();
  const [isLoading, setIsLoading] = useState(false);

  return {
    isLoading: isLoading || isSellerRegistrationLoading,
    registerSeller
  };
};
