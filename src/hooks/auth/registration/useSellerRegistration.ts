
/**
 * Changes made:
 * - 2024-12-30: Extracted from useAuth.tsx as part of refactoring for better maintainability
 * - 2024-12-30: Separated seller registration logic into a dedicated hook
 * - 2024-12-31: Refactored into smaller, more focused components
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRegistrationProcess } from "./useRegistrationProcess";
import { useRegistrationVerification } from "./useRegistrationVerification";
import { useRegistrationFallbacks } from "./useRegistrationFallbacks";
import { AuthRegisterResult, AuthActionOptions } from "../types";

/**
 * Hook for seller registration functionality with comprehensive error handling
 */
export const useSellerRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { performRegistration } = useRegistrationProcess();
  const { verifyRegistration } = useRegistrationVerification();
  const { applyFallbackMethods } = useRegistrationFallbacks();

  /**
   * Registers a user as a seller with comprehensive error handling and recovery
   * - Uses multiple fallback mechanisms to ensure successful registration
   * - Repairs inconsistent data states
   * - Provides detailed logging for troubleshooting
   * 
   * @param userId The ID of the user to register as a seller
   * @param options Optional configuration for the registration process
   * @returns Promise resolving to a result object with success status
   */
  const registerSeller = useCallback(async (
    userId: string, 
    options: AuthActionOptions = {}
  ): Promise<AuthRegisterResult> => {
    const { showToast = true } = options;
    
    try {
      setIsLoading(true);
      console.log("Starting seller registration process for user:", userId);
      
      // Step 1: Try primary registration method
      const primaryResult = await performRegistration(userId);
      if (primaryResult.success) {
        if (showToast) {
          toast.success("Seller registration successful!");
        }
        return primaryResult;
      }
      
      // Step 2: Verify if user is already registered
      const verificationResult = await verifyRegistration(userId);
      if (verificationResult.success) {
        if (showToast) {
          toast.success("Seller registration successful!");
        }
        return verificationResult;
      }
      
      // Step 3: Try fallback registration methods
      const fallbackResult = await applyFallbackMethods(userId);
      
      if (fallbackResult.success) {
        if (showToast) {
          toast.success("Seller registration successful!");
        }
        return fallbackResult;
      }
      
      // If we reach here, all methods failed
      throw new Error("Could not verify seller registration was completed");
    } catch (error: any) {
      console.error("Error registering seller:", error);
      
      // Provide more specific error messages based on the error type
      const errorMessage = error.message === 'Failed to update user role' 
        ? "Could not update your account role. Please try again."
        : error.message === 'Failed to create seller profile'
        ? "Could not create your seller profile. Please contact support."
        : error.message === 'Could not verify seller registration was completed'
        ? "Your account was created, but we couldn't verify your seller status. Please try to log out and log back in."
        : "An unexpected error occurred during registration. Please try again.";
        
      if (showToast) {
        toast.error(errorMessage);
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, [performRegistration, verifyRegistration, applyFallbackMethods]);

  return {
    isLoading,
    registerSeller
  };
};
