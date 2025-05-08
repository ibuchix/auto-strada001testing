
/**
 * Changes made:
 * - 2025-05-08: Created component to display registration status and provide recovery options
 * - 2025-05-08: Added support for automatic seller registration repair
 * - 2025-05-08: Added error handling for permission denied errors
 * - 2025-05-08: Improved recovery UX with clearer messaging
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Info } from "lucide-react";

export const RegistrationStatusCheck = () => {
  const { session, isSeller, refreshSellerStatus, isLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  
  // Attempt seller verification if logged in but not recognized as seller
  useEffect(() => {
    // If we have a session but user is not a seller and we haven't tried verification yet
    if (session && !isSeller && !verificationAttempted && !isLoading) {
      const verifyStatus = async () => {
        setIsVerifying(true);
        try {
          await refreshSellerStatus();
        } catch (error: any) {
          console.error("Error during seller verification:", error);
          // Check for permission denied errors
          if (error?.message?.includes('permission denied') || 
              (error?.code === '42501')) {
            setHasPermissionError(true);
          }
        } finally {
          setIsVerifying(false);
          setVerificationAttempted(true);
        }
      };
      
      verifyStatus();
    }
  }, [session, isSeller, refreshSellerStatus, verificationAttempted, isLoading]);
  
  // If not logged in or already confirmed as seller, don't show anything
  if (!session || isSeller || isLoading) {
    return null;
  }
  
  const handleRetryVerification = async () => {
    setIsVerifying(true);
    setHasPermissionError(false);
    try {
      await refreshSellerStatus();
    } catch (error) {
      console.error("Error during retry verification:", error);
      // Check for permission denied errors
      if (error && 
          typeof error === 'object' && 
          'message' in error && 
          typeof error.message === 'string' && 
          error.message.includes('permission denied')) {
        setHasPermissionError(true);
      }
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <Alert className={`mb-4 ${
      isVerifying ? 'bg-blue-50' : 
      hasPermissionError ? 'bg-orange-50' : 
      'bg-yellow-50'
    }`}>
      {isVerifying ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-500" />
          <div>
            <AlertTitle className="text-blue-700">Verifying Seller Status</AlertTitle>
            <AlertDescription className="text-blue-600">
              Please wait while we verify your seller account...
            </AlertDescription>
          </div>
        </>
      ) : hasPermissionError ? (
        <>
          <Info className="h-5 w-5 mr-2 text-orange-500" />
          <div className="flex-1">
            <AlertTitle className="text-orange-700">Account Verification Issue</AlertTitle>
            <AlertDescription className="text-orange-600 mb-2">
              We encountered a permission issue while verifying your seller status. This is often temporary and won't affect your ability to create listings.
            </AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryVerification}
              disabled={isVerifying}
              className="bg-white border-orange-500 text-orange-700 hover:bg-orange-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Retry Verification
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
          <div className="flex-1">
            <AlertTitle className="text-yellow-700">Seller Account Issue</AlertTitle>
            <AlertDescription className="text-yellow-600 mb-2">
              Your seller account status could not be verified. This may affect your ability to create listings.
            </AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryVerification}
              disabled={isVerifying}
              className="bg-white border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Account
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </Alert>
  );
};
