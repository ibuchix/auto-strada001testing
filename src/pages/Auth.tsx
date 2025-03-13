
/**
 * Changes made:
 * - 2024-03-26: Fixed supabase reference using supabaseClient from props
 * - 2024-03-26: Fixed theme type issue using appearance.theme
 * - 2024-03-26: Fixed useState type issue with proper initialization
 * - 2024-03-26: Updated formData setter to ensure required properties
 * - 2024-03-28: Fixed Theme type error by using an object with 'default' key
 * - 2024-03-28: Refactored into smaller components
 * - 2024-03-29: Fixed type mismatch between formData and registerDealer parameters
 * - 2024-04-01: Fixed DealerFormData to match DealerData type requirements
 * - 2024-06-24: Fixed authentication flow to properly display sign-up options
 * - 2024-06-24: Added specific seller registration support
 * - 2024-06-25: Fixed authentication page rendering issue and improved user experience
 * - 2024-06-26: Updated to use StandardAuth without directly passing supabaseClient
 * - 2024-06-26: Refactored into smaller components
 * - 2024-06-27: Redesigned auth page with improved layout and visuals
 * - 2024-06-28: Removed dealer registration functionality to make app seller-specific
 */

import { AccountOptions } from "@/components/auth/AccountOptions";
import { SellerRegistrationView } from "@/components/auth/SellerRegistrationView";
import { useAuthPage } from "@/hooks/useAuthPage";

const AuthPage = () => {
  const {
    isSeller,
    isLoading,
    setIsSeller,
    handleSellerSubmit,
    resetRegistrationState
  } = useAuthPage();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-5xl px-4 py-10">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-center font-kanit text-[#222020] mb-2">
              Welcome to Our Seller Platform
            </h1>
            <p className="text-subtitle text-center max-w-md mx-auto">
              Join our community of sellers to list your vehicles for auction
            </p>
          </div>
          
          <div className="w-full flex justify-center">
            {isSeller ? (
              <SellerRegistrationView
                onSubmit={handleSellerSubmit}
                onBack={resetRegistrationState}
                isLoading={isLoading}
              />
            ) : (
              <AccountOptions
                onSellerRegister={() => setIsSeller(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
