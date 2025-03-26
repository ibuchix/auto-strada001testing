
/**
 * Created: 2024-08-20
 * Changes made:
 * - 2025-12-01: Fixed usage of RegistrationRepairResult interface
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { sellerRecoveryService, RegistrationRepairResult } from "@/services/supabase/sellers/sellerRecoveryService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertCircle, RotateCw, ArrowRight } from "lucide-react";
import LoadingPage from "./LoadingPage";

// Define the diagnosis result interface matching sellerRecoveryService
interface SellerDiagnosisResult {
  metadataHasRole: boolean;
  profileHasRole: boolean;
  sellerRecordExists: boolean;
  isComplete: boolean;
  details: Record<string, any>;
}

const SellerRegistrationRepair = () => {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [diagnosisResult, setDiagnosisResult] = useState<SellerDiagnosisResult | null>(null);
  const [repairResult, setRepairResult] = useState<RegistrationRepairResult | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/auth");
    }
  }, [isLoading, session, navigate]);

  useEffect(() => {
    const runDiagnosis = async () => {
      if (!user) return;
      
      try {
        setDiagnosisLoading(true);
        setError(null);
        const result = await sellerRecoveryService.diagnoseSellerRegistration(user.id);
        setDiagnosisResult(result);
        
        // Auto-repair if all checks fail (likely new account)
        if (!result.metadataHasRole && !result.profileHasRole && !result.sellerRecordExists) {
          await handleRepair();
        }
      } catch (err: any) {
        console.error("Diagnosis error:", err);
        setError(err.message || "Failed to diagnose seller registration");
      } finally {
        setDiagnosisLoading(false);
      }
    };

    if (user) {
      runDiagnosis();
    }
  }, [user]);

  const handleRepair = async () => {
    if (!user) return;
    
    try {
      setIsRepairing(true);
      setError(null);
      const result = await sellerRecoveryService.repairSellerRegistration(user.id);
      setRepairResult(result);
      
      // Update diagnosis after repair
      const updatedDiagnosis = await sellerRecoveryService.diagnoseSellerRegistration(user.id);
      setDiagnosisResult(updatedDiagnosis);
      
      // If repair was successful and registration is now complete, show success for 2 seconds, then redirect
      if (result.success && result.repaired) {
        setTimeout(() => {
          navigate("/seller-dashboard");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Repair error:", err);
      setError(err.message || "Failed to repair seller registration");
    } finally {
      setIsRepairing(false);
    }
  };

  if (isLoading || !user) {
    return <LoadingPage message="Checking seller account status..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#DC143C]">Seller Account Repair</CardTitle>
          <CardDescription>
            This page diagnoses and repairs issues with your seller account registration.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {diagnosisLoading ? (
            <div className="flex flex-col items-center py-8">
              <RotateCw className="h-8 w-8 text-[#DC143C] animate-spin mb-4" />
              <p className="text-gray-600">Diagnosing your seller account...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Registration Status</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <StatusItem 
                    title="User Metadata" 
                    status={diagnosisResult?.metadataHasRole} 
                    description="Seller role in user metadata"
                  />
                  <StatusItem 
                    title="Profile Record" 
                    status={diagnosisResult?.profileHasRole} 
                    description="Seller role in profile table"
                  />
                  <StatusItem 
                    title="Seller Record" 
                    status={diagnosisResult?.sellerRecordExists} 
                    description="Seller record exists"
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex items-center">
                    {diagnosisResult?.isComplete ? (
                      <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-6 w-6 text-amber-500 mr-2" />
                    )}
                    <span className="font-medium">
                      {diagnosisResult?.isComplete 
                        ? "Your seller registration is complete" 
                        : "Your seller registration needs repair"}
                    </span>
                  </div>
                </div>
              </div>
              
              {repairResult && (
                <Alert variant={repairResult.success ? "success" : "destructive"} className={repairResult.success ? "bg-green-50 border-green-200" : ""}>
                  {repairResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {repairResult.success 
                      ? (repairResult.repaired ? "Repair Successful" : "No Repair Needed") 
                      : "Repair Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {repairResult.success 
                      ? (repairResult.repaired ? "Your seller account has been successfully repaired. You will be redirected to the dashboard." : "Your seller account is already correctly configured.") 
                      : "There was a problem repairing your seller account. Please try again or contact support."}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          
          <div className="flex gap-3">
            {!diagnosisLoading && !diagnosisResult?.isComplete && (
              <Button 
                onClick={handleRepair} 
                disabled={isRepairing}
                className="bg-[#DC143C] hover:bg-[#DC143C]/90"
              >
                {isRepairing ? (
                  <>
                    <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    Repairing...
                  </>
                ) : (
                  <>
                    Repair Account
                  </>
                )}
              </Button>
            )}
            
            {diagnosisResult?.isComplete && (
              <Button 
                onClick={() => navigate("/seller-dashboard")} 
                className="bg-[#DC143C] hover:bg-[#DC143C]/90"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

interface StatusItemProps {
  title: string;
  status: boolean | undefined;
  description: string;
}

const StatusItem = ({ title, status, description }: StatusItemProps) => (
  <div className="flex items-center gap-3 p-3 rounded-md border">
    {status === undefined ? (
      <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />
    ) : status ? (
      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
    ) : (
      <XCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
    )}
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

export default SellerRegistrationRepair;
