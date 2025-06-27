
/**
 * Changes made:
 * - 2024-06-26: Created component for seller registration view
 * - 2024-06-27: Redesigned for modern appearance with card-based layout
 * - 2024-11-14: Added status message display during registration process
 * - 2024-12-18: Enhanced with better loading states and progress feedback
 * - Updated 2025-06-15 (bounty): added username field for interface SellerRegistrationViewProps.onSubmit(params)
 */

import { Button } from "@/components/ui/button";
import { SellerRegistrationForm } from "@/components/auth/SellerRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

interface SellerRegistrationViewProps {
  onSubmit: (username:string, email: string, password: string) => void;
  onBack: () => void;
  isLoading: boolean;
  registrationStep?: 'initial' | 'processing' | 'complete';
}

export const SellerRegistrationView = ({
  onSubmit,
  onBack,
  isLoading,
  registrationStep = 'initial'
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
        {registrationStep === 'processing' || isLoading ? (
          <div className="bg-accent/40 p-6 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 size={40} className="animate-spin mb-4 text-primary" />
            <p className="text-center text-subtitle font-medium">
              Creating your seller account...
            </p>
            <p className="text-center text-sm mt-2 max-w-xs text-muted-foreground">
              We're setting up your profile so you can start listing vehicles for sale
            </p>
          </div>
        ) : registrationStep === 'complete' ? (
          <div className="bg-accent/40 p-6 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
            <CheckCircle size={40} className="mb-4 text-green-600" />
            <p className="text-center text-subtitle font-medium">
              Registration successful!
            </p>
            <p className="text-center text-sm mt-2 max-w-xs text-muted-foreground">
              Your seller account has been created. You'll be redirected to your dashboard shortly.
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
          disabled={isLoading || registrationStep === 'processing' || registrationStep === 'complete'}
        >
          <ArrowLeft size={16} />
          Back to Sign In / Sign Up
        </Button>
      </CardContent>
    </Card>
  );
};
