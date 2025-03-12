
/**
 * Changes made:
 * - 2024-06-26: Created component for seller registration view
 */

import { Button } from "@/components/ui/button";
import { SellerRegistrationForm } from "@/components/auth/SellerRegistrationForm";

interface SellerRegistrationViewProps {
  onSubmit: (email: string, password: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const SellerRegistrationView = ({
  onSubmit,
  onBack,
  isLoading
}: SellerRegistrationViewProps) => {
  return (
    <div className="w-full max-w-md p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center font-kanit text-[#222020]">Register as Seller</h1>
      
      <SellerRegistrationForm 
        onSubmit={onSubmit} 
        isLoading={isLoading} 
      />
      
      <Button
        variant="link"
        onClick={onBack}
        className="w-full text-[#4B4DED]"
      >
        Back to Sign In / Sign Up
      </Button>
    </div>
  );
};
