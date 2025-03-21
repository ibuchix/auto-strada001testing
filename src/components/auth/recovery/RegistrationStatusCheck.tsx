
/**
 * Changes made:
 * - 2025-06-12: Created component for detecting and offering to repair broken registrations
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sellerRecoveryService } from "@/services/supabase/sellers/sellerRecoveryService";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Component that checks for incomplete seller registrations and offers repair
 * Can be shown on dashboard or seller areas when problems are detected
 */
export const RegistrationStatusCheck = () => {
  const { session, isSeller } = useAuth();
  const [hasIssue, setHasIssue] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkRegistration = async () => {
      if (!session?.user?.id) return;
      
      try {
        setIsChecking(true);
        
        // Only perform diagnostics if they're not already identified as a seller
        if (!isSeller) {
          const diagnosis = await sellerRecoveryService.diagnoseSellerRegistration(session.user.id);
          
          // If some components exist but registration isn't complete, we have an issue
          const partialRegistration = 
            (diagnosis.metadataHasRole || diagnosis.profileHasRole || diagnosis.sellerRecordExists) 
            && !diagnosis.isComplete;
            
          setHasIssue(partialRegistration);
        } else {
          setHasIssue(false);
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkRegistration();
  }, [session, isSeller]);
  
  if (isChecking || !hasIssue || !session) {
    return null;
  }
  
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Seller Registration Issue Detected</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          We detected an incomplete seller registration that may cause problems with selling features.
        </p>
        <Button 
          size="sm" 
          variant="outline"
          className="self-start mt-2"
          onClick={() => navigate('/seller-registration-repair')}
        >
          Repair Registration
        </Button>
      </AlertDescription>
    </Alert>
  );
};
