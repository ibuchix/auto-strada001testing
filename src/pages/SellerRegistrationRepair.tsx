
/**
 * Created: 2024-08-20
 * Page for repairing seller registration issues
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useSellerRecovery } from "@/hooks/auth/recovery/useSellerRecovery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";

const SellerRegistrationRepair = () => {
  const { session, isSeller, refreshSellerStatus } = useAuth();
  const { isRepairing, diagnosisResult, diagnoseRegistration, repairRegistration } = useSellerRecovery();
  const [hasDiagnosed, setHasDiagnosed] = useState(false);
  const [repairCompleted, setRepairCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.user) {
      diagnoseRegistration();
      setHasDiagnosed(true);
    }
  }, [session, diagnoseRegistration]);

  const handleRepair = async () => {
    const success = await repairRegistration();
    if (success) {
      setRepairCompleted(true);
      // Refresh seller status after repair
      await refreshSellerStatus();
    }
  };

  const handleGotoDashboard = () => {
    navigate('/seller-dashboard');
  };

  if (!session) {
    return (
      <div className="container mx-auto max-w-md py-8 px-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You must be logged in to repair your seller registration.
            <div className="mt-4">
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-[#DC143C] hover:bg-[#DC143C]/90"
              >
                Sign In
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Seller Registration Repair</h1>
      
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Registration Status</CardTitle>
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
          ) : repairCompleted ? (
            <Alert variant="default">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Repair Completed</AlertTitle>
              <AlertDescription>
                Your seller registration has been successfully repaired and validated.
              </AlertDescription>
            </Alert>
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
          {repairCompleted || (diagnosisResult && diagnosisResult.isComplete) ? (
            <Button 
              className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
              onClick={handleGotoDashboard}
            >
              Go to Dashboard
            </Button>
          ) : diagnosisResult && !diagnosisResult.isComplete ? (
            <Button 
              className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
              onClick={handleRepair}
              disabled={isRepairing}
            >
              Repair Registration
            </Button>
          ) : null}
          
          {!repairCompleted && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => diagnoseRegistration()}
              disabled={isRepairing}
            >
              {hasDiagnosed ? "Re-check Status" : "Check Status"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SellerRegistrationRepair;
