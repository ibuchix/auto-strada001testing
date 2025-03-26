
/**
 * Created: 2024-08-20
 * Page for the seller to create a car listing
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RegistrationStatusCheck } from "@/components/auth/recovery/RegistrationStatusCheck";
import { AuthErrorHandler } from "@/components/error-handling/AuthErrorHandler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SellerFormPage = () => {
  const { session, isSeller } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading time to check seller status
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!isSeller) {
        setError("You must be registered as a seller to create a listing.");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [isSeller]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create Car Listing</h1>
      
      {/* Show registration status check if there are issues */}
      <RegistrationStatusCheck />
      
      {/* Show error if not a seller */}
      {error && (
        <AuthErrorHandler 
          error={error}
          isRlsError={true}
          showSignIn={false}
        />
      )}
      
      {isSeller && (
        <Card>
          <CardHeader>
            <CardTitle>Sell Your Car</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You can create a new car listing here. Fill out the form with all the details about your car.
            </p>
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={() => navigate('/seller-dashboard/create-listing')}
                className="bg-[#DC143C] hover:bg-[#DC143C]/90"
              >
                Create New Listing
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/seller-dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerFormPage;
