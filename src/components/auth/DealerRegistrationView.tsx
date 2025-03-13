
/**
 * Changes made:
 * - 2024-06-26: Created component for dealer registration view
 * - 2024-06-27: Redesigned for modern appearance with card-based layout
 */

import { Button } from "@/components/ui/button";
import { DealerRegistrationForm, DealerFormData } from "@/components/auth/DealerRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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
    <Card className="w-full max-w-md border-none shadow-lg animate-fade-in">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-3xl font-bold text-center font-kanit text-[#222020]">Register as Dealer</CardTitle>
        <CardDescription className="text-subtitle text-center">
          Create your dealer account to access auction features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="bg-accent/40 p-6 rounded-lg">
          <DealerRegistrationForm 
            onSubmit={onSubmit} 
            isLoading={isLoading} 
          />
        </div>
        
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full mt-4 text-[#4B4DED] font-medium flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Sign In / Sign Up
        </Button>
      </CardContent>
    </Card>
  );
};
