
/**
 * Changes made:
 * - 2025-06-12: Created hook for diagnosing and repairing seller registration issues
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { sellerRecoveryService } from "@/services/supabase/sellers/sellerRecoveryService";

export const useSellerRecovery = () => {
  const { session, refreshSellerStatus } = useAuth();
  const [isRepairing, setIsRepairing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<{
    metadataHasRole: boolean;
    profileHasRole: boolean;
    sellerRecordExists: boolean;
    isComplete: boolean;
  } | null>(null);

  /**
   * Diagnoses seller registration status without making repairs
   */
  const diagnoseRegistration = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to use this feature");
      return null;
    }
    
    try {
      const result = await sellerRecoveryService.diagnoseSellerRegistration(session.user.id);
      setDiagnosisResult(result);
      return result;
    } catch (error) {
      console.error("Error during registration diagnosis:", error);
      toast.error("Could not diagnose registration status");
      return null;
    }
  }, [session]);

  /**
   * Attempts to repair an incomplete seller registration
   */
  const repairRegistration = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to use this feature");
      return false;
    }
    
    setIsRepairing(true);
    try {
      const toastId = toast.loading("Repairing seller registration...");
      
      const result = await sellerRecoveryService.repairSellerRegistration(session.user.id);
      
      if (result.success) {
        if (result.repaired) {
          toast.dismiss(toastId);
          toast.success("Registration repaired successfully", {
            description: result.diagnosisDetails.repairActions.join(', ')
          });
          
          // Update session state to reflect the repaired status
          await refreshSellerStatus();
          
          // Update diagnosis result after repair
          setDiagnosisResult({
            metadataHasRole: true,
            profileHasRole: true,
            sellerRecordExists: true,
            isComplete: true
          });
          
          return true;
        } else {
          toast.dismiss(toastId);
          toast.info("No repairs needed", {
            description: "Your seller registration is already complete."
          });
          
          // Run refresh anyway to ensure all state is updated
          await refreshSellerStatus();
          
          return true;
        }
      } else {
        toast.dismiss(toastId);
        toast.error("Repair failed", {
          description: "Could not repair your seller registration. Please contact support."
        });
        return false;
      }
    } catch (error) {
      console.error("Error repairing registration:", error);
      toast.error("Repair failed", {
        description: "An unexpected error occurred during repair."
      });
      return false;
    } finally {
      setIsRepairing(false);
    }
  }, [session, refreshSellerStatus]);

  return {
    isRepairing,
    diagnosisResult,
    diagnoseRegistration,
    repairRegistration
  };
};
