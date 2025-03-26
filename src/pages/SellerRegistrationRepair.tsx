
/**
 * Created: 2025-08-25
 * Page for diagnosing and repairing seller registration issues
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Shield } from "lucide-react";
import { useSellerRecovery } from "@/hooks/auth/recovery/useSellerRecovery";
import { useAuth } from "@/components/AuthProvider";

const SellerRegistrationRepair = () => {
  const { diagnosis, error, isLoading, runDiagnosis, repairRegistration } = useSellerRecovery();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [repairAttempted, setRepairAttempted] = useState(false);
  
  useEffect(() => {
    // Run diagnosis as soon as the page loads
    if (session && !diagnosis) {
      runDiagnosis();
    }
  }, [session, diagnosis, runDiagnosis]);
  
  const handleRepair = async () => {
    setRepairAttempted(true);
    await repairRegistration();
  };
  
  const handleRetry = () => {
    runDiagnosis();
  };
  
  const handleBackToDashboard = () => {
    navigate('/seller-dashboard');
  };
  
  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access this page.
          </AlertDescription>
        </Alert>
        
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Seller Registration Diagnosis</CardTitle>
          <CardDescription>
            This tool will diagnose and repair issues with your seller registration status
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {diagnosis && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Diagnosis Results</h3>
                
                <Alert variant={diagnosis.success ? "default" : "warning"}>
                  {diagnosis.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {diagnosis.success 
                      ? "Diagnosis completed successfully"
                      : "Diagnosis completed with issues"}
                  </AlertDescription>
                </Alert>
                
                {diagnosis.repaired && (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Repair Successful</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Your seller registration has been repaired. You should now be able to access seller features.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DiagnosisItem 
                    title="User Metadata"
                    status={diagnosis.diagnosisDetails.hasMetadata}
                    description={diagnosis.diagnosisDetails.hasMetadata 
                      ? `Role: ${diagnosis.diagnosisDetails.metadataRole}`
                      : "Seller role not set in metadata"}
                  />
                  
                  <DiagnosisItem 
                    title="Profile Record"
                    status={diagnosis.diagnosisDetails.hasProfileRecord}
                    description={diagnosis.diagnosisDetails.hasProfileRecord 
                      ? `Role: ${diagnosis.diagnosisDetails.profileRole}` 
                      : "Profile record not found"}
                  />
                  
                  <DiagnosisItem 
                    title="Seller Record"
                    status={diagnosis.diagnosisDetails.hasSellerRecord}
                    description={diagnosis.diagnosisDetails.hasSellerRecord 
                      ? "Seller record exists" 
                      : "Seller record not found"}
                  />
                  
                  <DiagnosisItem 
                    title="Overall Status"
                    status={diagnosis.diagnosisDetails.hasMetadata && 
                            diagnosis.diagnosisDetails.hasProfileRecord && 
                            diagnosis.diagnosisDetails.hasSellerRecord}
                    description="All required records and permissions"
                  />
                </div>
              </div>
              
              {(!diagnosis.diagnosisDetails.hasMetadata || 
                !diagnosis.diagnosisDetails.hasProfileRecord || 
                !diagnosis.diagnosisDetails.hasSellerRecord) && !diagnosis.repaired && (
                <Alert variant={repairAttempted ? "destructive" : "warning"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Registration Issues Detected</AlertTitle>
                  <AlertDescription>
                    Your seller registration is incomplete or has issues. Click "Repair Registration" to fix these issues.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
          
          {isLoading && (
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleRetry}
            disabled={isLoading}
          >
            Run Diagnosis Again
          </Button>
          
          {diagnosis && (!diagnosis.diagnosisDetails.hasMetadata || 
            !diagnosis.diagnosisDetails.hasProfileRecord || 
            !diagnosis.diagnosisDetails.hasSellerRecord) && !diagnosis.repaired ? (
            <Button 
              variant="default"
              onClick={handleRepair}
              disabled={isLoading}
              className="bg-[#DC143C] hover:bg-[#DC143C]/90"
            >
              <Shield className="h-4 w-4 mr-2" />
              Repair Registration
            </Button>
          ) : (
            <Button 
              variant="default"
              onClick={handleBackToDashboard}
              disabled={isLoading}
            >
              Back to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

interface DiagnosisItemProps {
  title: string;
  status: boolean;
  description: string;
}

const DiagnosisItem = ({ title, status, description }: DiagnosisItemProps) => {
  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{title}</h4>
        {status ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default SellerRegistrationRepair;
