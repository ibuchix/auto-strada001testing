
/**
 * Changes made:
 * - 2024-06-26: Created component for seller registration view
 * - 2024-06-27: Redesigned for modern appearance with card-based layout
 * - 2024-11-14: Added status message display during registration process
 */

import { Button } from "@/components/ui/button";
import { SellerRegistrationForm } from "@/components/auth/SellerRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

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
    <Card className="w-full max-w-md border-none shadow-lg animate-fade-in">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-3xl font-bold text-center font-kanit text-[#222020]">Register as Seller</CardTitle>
        <CardDescription className="text-subtitle text-center">
          Create your seller account to list your vehicles
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="bg-accent/40 p-6 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 size={40} className="animate-spin mb-4 text-primary" />
            <p className="text-center text-subtitle">
              Creating your seller account...
            </p>
            <p className="text-center text-sm mt-2 max-w-xs">
              This process ensures you'll be able to list vehicles for sale on our platform
            </p>
          </div>
        ) : (
          <div className="bg-accent/40 p-6 rounded-lg">
            <SellerRegistrationForm 
              onSubmit={onSubmit} 
              isLoading={isLoading} 
            />
          </div>
        )}
        
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full mt-4 text-[#4B4DED] font-medium flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          <ArrowLeft size={16} />
          Back to Sign In / Sign Up
        </Button>
      </CardContent>
    </Card>
  );
};
