
/**
 * Created: 2024-08-20
 * Dashboard page for sellers
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { AuthErrorHandler } from "@/components/error-handling/AuthErrorHandler";
import { RegistrationStatusCheck } from "@/components/auth/recovery/RegistrationStatusCheck";
import { sellerProfileService } from "@/services/supabase/sellers";

const SellerDashboard = () => {
  const { session, isSeller, refreshSellerStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRlsError, setIsRlsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSellerData = async () => {
      try {
        if (!session?.user?.id) return;
        
        setIsLoading(true);
        setIsRlsError(false);
        setErrorMessage(null);
        
        // Verify seller profile access
        const profile = await sellerProfileService.getSellerProfile(session.user.id);
        
        if (!profile && isSeller) {
          // This is an RLS error - we believe we're a seller but can't access the data
          setIsRlsError(true);
          setErrorMessage("You don't have permission to access seller data. This may be due to a registration issue.");
        }
        
      } catch (error: any) {
        console.error("Error loading seller dashboard:", error);
        
        // Check if this is an RLS permission error
        if (error.code === 'PGRST301' || (error.message && error.message.includes('permission denied'))) {
          setIsRlsError(true);
          setErrorMessage("Permission denied when accessing seller data. Your seller registration may need repair.");
        } else {
          setErrorMessage(error.message || "Error loading dashboard data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSellerData();
  }, [session, isSeller]);

  // Handle retry for RLS errors
  const handleRlsRetry = async () => {
    try {
      setIsLoading(true);
      
      if (!session?.user?.id) return;
      
      // Attempt to refresh seller status
      await refreshSellerStatus();
      
      // Clear errors and reload
      setIsRlsError(false);
      setErrorMessage(null);
    } catch (error) {
      console.error("Error handling RLS retry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
      
      {/* Registration status check will show repair option if needed */}
      <RegistrationStatusCheck />
      
      {/* Show error handler with repair link for RLS issues */}
      {(isRlsError || errorMessage) && (
        <AuthErrorHandler 
          error={errorMessage || "Permission error detected"}
          onRetry={handleRlsRetry}
          isRlsError={isRlsError}
          showSignIn={false}
        />
      )}
      
      {/* Main dashboard content - only show if no RLS errors */}
      {!isRlsError && !errorMessage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Listings</CardTitle>
              <CardDescription>Manage your car listings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/seller-dashboard/listings')}
                className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
              >
                View Listings
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Create Listing</CardTitle>
              <CardDescription>List a new car for sale</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/seller-form')}
                className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
              >
                Sell a Car
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your seller profile</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/seller-dashboard/profile')}
                variant="outline"
                className="w-full"
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
