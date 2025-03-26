
/**
 * Created: 2025-08-26
 * Component to check seller registration status
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { sellerRecoveryService } from "@/services/supabase/sellers/sellerRecoveryService";
import { toast } from "sonner";

interface RegistrationStatusCheckProps {
  children: React.ReactNode;
}

export function RegistrationStatusCheck({ children }: RegistrationStatusCheckProps) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    if (!session) {
      setIsChecking(false);
      return;
    }
    
    const checkRegistration = async () => {
      try {
        const diagnosisResult = await sellerRecoveryService.diagnoseSellerStatus(session);
        
        if (!diagnosisResult.success || 
            !diagnosisResult.diagnosisDetails.hasProfileRecord || 
            !diagnosisResult.diagnosisDetails.hasSellerRecord) {
          
          toast.error("Seller registration issues detected", {
            description: "Your account needs to be repaired to access seller features",
            action: {
              label: "Repair Now",
              onClick: () => navigate("/seller/repair")
            },
            duration: 8000
          });
          
          setIsValid(false);
        } else {
          setIsValid(true);
        }
      } catch (error) {
        console.error("Error checking registration:", error);
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkRegistration();
  }, [session, navigate]);
  
  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isValid && session) {
    navigate("/seller/repair");
    return null;
  }
  
  return <>{children}</>;
}
