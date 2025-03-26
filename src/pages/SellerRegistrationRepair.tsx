
/**
 * Changes made:
 * - 2025-05-16: Created dedicated page for fixing seller registration issues
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sellerRecoveryService } from "@/services/supabase/sellers/sellerRecoveryService";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * Page for fixing seller registration issues
 * This page is shown when a seller has incomplete or inconsistent registration data
 */
const SellerRegistrationRepair = () => {
  const { session, refreshSellerStatus } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRepairing, setIsRepairing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [repairAttempted, setRepairAttempted] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState(false);
  
  useEffect(() => {
    const checkRegistration = async () => {
      if (!session?.user?.id) {
        navigate('/auth');
        return;
      }
      
      setIsLoading(true);
      try {
        const diagnosisResult = await sellerRecoveryService.diagnoseSellerRegistration(session.user.id);
        setDiagnosis(diagnosisResult);
        
        // If everything is already fixed, redirect back to dashboard
        if (diagnosisResult.isComplete) {
          await refreshSellerStatus();
          navigate('/seller-dashboard');
        }
      } catch (error) {
        console.error("Error diagnosing registration:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkRegistration();
  }, [session, navigate, refreshSellerStatus]);
  
  const handleRepair = async () => {
    if (!session?.user?.id) return;
    
    setIsRepairing(true);
    try {
      const success = await sellerRecoveryService.repairSellerRegistration(session.user.id);
      setRepairSuccess(success);
      
      // Refresh seller status in auth context
      await refreshSellerStatus();
      
      // Get updated diagnosis
      const updatedDiagnosis = await sellerRecoveryService.diagnoseSellerRegistration(session.user.id);
      setDiagnosis(updatedDiagnosis);
    } catch (error) {
      console.error("Error repairing registration:", error);
      setRepairSuccess(false);
    } finally {
      setIsRepairing(false);
      setRepairAttempted(true);
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Seller Registration Repair</CardTitle>
            <CardDescription>
              We've detected an issue with your seller account that needs to be fixed.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
                <p className="mt-4 text-gray-600">Diagnosing your account...</p>
              </div>
            ) : (
              <>
                <Alert variant={diagnosis?.isComplete ? "success" : "warning"} className="mb-6">
                  {diagnosis?.isComplete ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {diagnosis?.isComplete ? "Account is now properly configured" : "Registration needs repair"}
                  </AlertTitle>
                  <AlertDescription>
                    {diagnosis?.isComplete
                      ? "Your seller account is now properly configured. You can return to the dashboard."
                      : "We found inconsistencies in your seller account configuration. Click the repair button below to fix them."}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium">Diagnosis Results:</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      {diagnosis?.metadataHasRole ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>User Metadata Status</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {diagnosis?.profileHasRole ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>User Profile Status</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {diagnosis?.sellerRecordExists ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>Seller Record Status</span>
                    </div>
                  </div>
                </div>
                
                {repairAttempted && (
                  <Alert variant={repairSuccess ? "success" : "destructive"} className="mt-6">
                    {repairSuccess ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {repairSuccess ? "Repair Successful" : "Repair Encountered Issues"}
                    </AlertTitle>
                    <AlertDescription>
                      {repairSuccess
                        ? "Your seller account has been successfully repaired. You can now return to the dashboard."
                        : "We had some issues repairing your account. Please try again or contact support."}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
          
          <Separator />
          
          <CardFooter className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              disabled={isRepairing}
            >
              Back to Home
            </Button>
            
            <div className="space-x-2">
              {!diagnosis?.isComplete && (
                <Button
                  onClick={handleRepair}
                  disabled={isRepairing}
                  className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
                >
                  {isRepairing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isRepairing ? "Repairing..." : "Repair Account"}
                </Button>
              )}
              
              {(diagnosis?.isComplete || repairSuccess) && (
                <Button
                  onClick={() => navigate('/seller-dashboard')}
                  className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default SellerRegistrationRepair;
