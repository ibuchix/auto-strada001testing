
/**
 * Created: 2025-08-26
 * Recovery panel for seller registration issues
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { useSellerRecovery } from "@/hooks/auth/recovery/useSellerRecovery";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RegistrationRecoveryPanel() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  
  const { 
    isLoading, 
    error, 
    diagnosis, 
    runDiagnosis, 
    repairRegistration 
  } = useSellerRecovery();
  
  const handleStartDiagnosis = async () => {
    setHasStarted(true);
    await runDiagnosis();
  };
  
  const handleRepair = async () => {
    setIsRepairing(true);
    await repairRegistration();
    setIsRepairing(false);
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Seller Account Repair
        </CardTitle>
        <CardDescription>
          Fix issues with your seller registration
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!hasStarted ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              If you're experiencing issues with your seller account, this tool can diagnose and fix common problems.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  {isRepairing ? "Repairing your account..." : "Diagnosing your account..."}
                </p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : diagnosis ? (
              <div className="space-y-3">
                <Alert variant={diagnosis.success ? "default" : "warning"}>
                  <div className="flex items-start gap-2">
                    {diagnosis.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    )}
                    <div>
                      <AlertTitle>
                        {diagnosis.success 
                          ? "Diagnosis Complete" 
                          : "Issues Detected"}
                      </AlertTitle>
                      <AlertDescription>
                        {diagnosis.repaired 
                          ? "Your account has been repaired successfully."
                          : diagnosis.success 
                            ? "Your account configuration looks good."
                            : "We found some issues with your seller account."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
                
                {diagnosis.diagnosisDetails && (
                  <div className="text-sm space-y-2 border rounded-md p-3 bg-muted/50">
                    <p className="font-medium">Account Status:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full ${diagnosis.diagnosisDetails.hasProfileRecord ? 'bg-green-500' : 'bg-amber-500'}`} />
                        Profile Record: {diagnosis.diagnosisDetails.hasProfileRecord ? 'Created' : 'Missing'}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full ${diagnosis.diagnosisDetails.hasSellerRecord ? 'bg-green-500' : 'bg-amber-500'}`} />
                        Seller Record: {diagnosis.diagnosisDetails.hasSellerRecord ? 'Created' : 'Missing'}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full ${diagnosis.diagnosisDetails.hasMetadata ? 'bg-green-500' : 'bg-amber-500'}`} />
                        Metadata: {diagnosis.diagnosisDetails.hasMetadata ? 'Correct' : 'Missing/Incorrect'}
                      </li>
                    </ul>
                  </div>
                )}
                
                {diagnosis.repaired && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Repair Successful</AlertTitle>
                    <AlertDescription>
                      Your seller account has been repaired. You can now access seller features.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {!hasStarted ? (
          <Button 
            className="w-full" 
            onClick={handleStartDiagnosis}
          >
            Start Diagnosis
          </Button>
        ) : diagnosis && !diagnosis.repaired && diagnosis.diagnosisDetails && 
           (!diagnosis.diagnosisDetails.hasProfileRecord || 
            !diagnosis.diagnosisDetails.hasSellerRecord) ? (
          <Button 
            className="w-full" 
            onClick={handleRepair}
            disabled={isLoading || isRepairing}
          >
            {isRepairing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Repairing...
              </>
            ) : (
              "Repair My Account"
            )}
          </Button>
        ) : null}
        
        {diagnosis && diagnosis.repaired && (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => window.location.href = "/dashboard"}
          >
            Go to Dashboard
          </Button>
        )}
        
        {hasStarted && !isLoading && !isRepairing && (
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => setHasStarted(false)}
          >
            Back
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
