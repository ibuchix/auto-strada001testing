
/**
 * Changes made:
 * - 2024-06-26: Created component for dealer registration view
 */

import { Button } from "@/components/ui/button";
import { DealerRegistrationForm, DealerFormData } from "@/components/auth/DealerRegistrationForm";

interface DealerRegistrationViewProps {
  onSubmit: (values: DealerFormData) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const DealerRegistrationView = ({
  onSubmit,
  onBack,
  isLoading
}: DealerRegistrationViewProps) => {
  return (
    <div className="w-full max-w-md p-4 space-y-4">
      <h1 className="text-3xl font-bold text-center font-kanit text-[#222020]">Register as Dealer</h1>
      
      <DealerRegistrationForm 
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
