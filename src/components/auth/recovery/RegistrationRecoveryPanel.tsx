
/**
 * Changes made:
 * - 2025-06-12: Created component for showing registration status and repair options
 * - 2025-06-12: Fixed TypeScript error with Alert variant
 */

import { useState, useEffect } from "react";
import { useSellerRecovery } from "@/hooks/auth/recovery/useSellerRecovery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface RegistrationRecoveryPanelProps {
  onComplete?: () => void;
}

export const RegistrationRecoveryPanel = ({ onComplete }: RegistrationRecoveryPanelProps) => {
  const { session, isSeller } = useAuth();
  const { isRepairing, diagnosisResult, diagnoseRegistration, repairRegistration } = useSellerRecovery();
  const [hasDiagnosed, setHasDiagnosed] = useState(false);

  useEffect(() => {
    if (session?.user) {
      diagnoseRegistration();
      setHasDiagnosed(true);
    }
  }, [session, diagnoseRegistration]);

  const handleRepair = async () => {
    const success = await repairRegistration();
    if (success && onComplete) {
      onComplete();
    }
  };
  
  if (!session) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You must be logged in to diagnose or repair your seller registration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Seller Registration Status</CardTitle>
        <CardDescription>
          Diagnose and repair any issues with your seller registration
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isRepairing ? (
          <div className="py-8 flex flex-col items-center">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-center font-medium">Repairing registration...</p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              This may take a few moments
            </p>
          </div>
        ) : hasDiagnosed && diagnosisResult ? (
          <div className="space-y-4">
            <Alert variant={diagnosisResult.isComplete ? "default" : "warning"}>
              {diagnosisResult.isComplete ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {diagnosisResult.isComplete 
                  ? "Registration Complete" 
                  : "Incomplete Registration"}
              </AlertTitle>
              <AlertDescription>
                {diagnosisResult.isComplete 
                  ? "Your seller registration is complete and functional."
                  : "Your seller registration appears to be incomplete. Repair is recommended."}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">User metadata has seller role</span>
                {diagnosisResult.metadataHasRole ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">Profile has seller role</span>
                {diagnosisResult.profileHasRole ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">Seller record exists</span>
                {diagnosisResult.sellerRecordExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="font-medium">Current seller status</span>
                {isSeller ? (
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-medium">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-center font-medium">Diagnosing registration status...</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {diagnosisResult && !diagnosisResult.isComplete && (
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleRepair}
            disabled={isRepairing || diagnosisResult.isComplete}
          >
            Repair Registration
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => diagnoseRegistration()}
          disabled={isRepairing}
        >
          {hasDiagnosed ? "Re-check Status" : "Check Status"}
        </Button>
      </CardFooter>
    </Card>
  );
};
