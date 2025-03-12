
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
 */

import { AccountOptions } from "@/components/auth/AccountOptions";
import { DealerRegistrationView } from "@/components/auth/DealerRegistrationView";
import { SellerRegistrationView } from "@/components/auth/SellerRegistrationView";
import { useAuthPage } from "@/hooks/useAuthPage";

const AuthPage = () => {
  const {
    isDealer,
    isSeller,
    isLoading,
    setIsDealer,
    setIsSeller,
    handleDealerSubmit,
    handleSellerSubmit,
    resetRegistrationState
  } = useAuthPage();

  if (isSeller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <SellerRegistrationView
          onSubmit={handleSellerSubmit}
          onBack={resetRegistrationState}
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (isDealer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <DealerRegistrationView
          onSubmit={handleDealerSubmit}
          onBack={resetRegistrationState}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <AccountOptions
        onSellerRegister={() => setIsSeller(true)}
        onDealerRegister={() => setIsDealer(true)}
      />
    </div>
  );
};

export default AuthPage;
