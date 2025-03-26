
/**
 * Changes made:
 * - 2025-06-12: Created page for repairing seller registration
 */

import { useNavigate } from "react-router-dom";
import { RegistrationRecoveryPanel } from "@/components/auth/recovery/RegistrationRecoveryPanel";

const SellerRegistrationRepairPage = () => {
  const navigate = useNavigate();
  
  const handleComplete = () => {
    // Navigate to seller dashboard after successful repair
    navigate("/dashboard/seller");
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold font-kanit text-[#222020] mb-2">
              Seller Registration Repair
            </h1>
            <p className="text-subtitle max-w-lg mx-auto">
              Fix registration issues that may prevent you from accessing seller features
            </p>
          </div>
          
          <RegistrationRecoveryPanel onComplete={handleComplete} />
          
          <div className="mt-8 text-center max-w-md">
            <p className="text-sm text-muted-foreground">
              This tool will diagnose your seller registration status and attempt to repair any issues.
              If problems persist after repair, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegistrationRepairPage;
