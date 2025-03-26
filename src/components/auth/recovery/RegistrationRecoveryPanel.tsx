
/**
 * Updated: 2025-08-27
 * Fixed Badge variant type and destructuring of props
 */

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface RegistrationRecoveryPanelProps {
  isLoading: boolean;
  error: string | null;
  diagnosis: any;
  runDiagnosis: () => Promise<any>;
  repairRegistration: () => Promise<any>;
}

export const RegistrationRecoveryPanel: React.FC<RegistrationRecoveryPanelProps> = ({
  isLoading,
  error,
  diagnosis,
  runDiagnosis,
  repairRegistration
}) => {
  useEffect(() => {
    if (!diagnosis) {
      runDiagnosis();
    }
  }, [diagnosis, runDiagnosis]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Checking Registration Status</span>
            </div>
          </CardTitle>
          <CardDescription>
            We're diagnosing your seller registration...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={runDiagnosis}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!diagnosis) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Registration Status Unknown</CardTitle>
          <CardDescription>
            We couldn't determine your registration status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runDiagnosis}>Run Diagnosis</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Registration Status</CardTitle>
          <Badge variant={diagnosis.success ? "default" : "destructive"}>
            {diagnosis.success ? "Complete" : "Incomplete"}
          </Badge>
        </div>
        <CardDescription>
          {diagnosis.success 
            ? "Your seller registration is complete." 
            : "Your seller registration needs repair."
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!diagnosis.success && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Registration Issues</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {!diagnosis.diagnosisDetails?.hasProfileRecord && (
                  <li>User profile record is missing</li>
                )}
                {!diagnosis.diagnosisDetails?.hasSellerRecord && (
                  <li>Seller record is missing</li>
                )}
                {!diagnosis.diagnosisDetails?.hasSellerRole && (
                  <li>Seller role is not assigned</li>
                )}
                {!diagnosis.diagnosisDetails?.isVerified && (
                  <li>Account is not verified</li>
                )}
              </ul>
            </div>

            <Button 
              onClick={repairRegistration} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Repairing...
                </>
              ) : (
                "Repair Registration"
              )}
            </Button>
          </div>
        )}

        {diagnosis.success && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Registration Status</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>User profile: <Badge variant="default">Created</Badge></li>
                <li>Seller record: <Badge variant="default">Created</Badge></li>
                <li>Account role: <Badge variant="default">Assigned</Badge></li>
                <li>Verification: <Badge variant="default">Complete</Badge></li>
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              onClick={runDiagnosis} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Re-check Status"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
