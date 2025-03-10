
/**
 * Changes made:
 * - 2024-03-26: Fixed supabase reference using supabaseClient from props
 * - 2024-03-26: Fixed theme type issue using appearance.theme
 * - 2024-03-26: Fixed useState type issue with proper initialization
 * - 2024-03-26: Updated formData setter to ensure required properties
 * - 2024-03-28: Fixed Theme type error by using an object with 'default' key
 * - 2024-03-28: Refactored into smaller components
 * - 2024-03-29: Fixed type mismatch between formData and registerDealer parameters
 */

import { useState } from "react";
import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DealerRegistrationForm, DealerFormData } from "@/components/auth/DealerRegistrationForm";
import { StandardAuth } from "@/components/auth/StandardAuth";
import { useAuthActions } from "@/hooks/useAuth";

const AuthPage = () => {
  const [isDealer, setIsDealer] = useState(false);
  // Initialize formData with required properties to match DealerFormData type
  const [formData, setFormData] = useState<DealerFormData>({
    dealershipName: "",
    licenseNumber: "",
    supervisorName: "",
    taxId: "",
    businessRegNumber: "",
    address: "",
  });
  
  const supabaseClient = useSupabaseClient();
  const session = useSession();
  const user = useUser();
  const navigate = useNavigate();
  const { isLoading, registerDealer, signInWithGoogle } = useAuthActions();

  useEffect(() => {
    if (session) {
      if (user?.role === "dealer") {
        navigate("/dashboard/dealer");
      } else if (user?.role === "seller") {
        navigate("/dashboard/seller");
      } else {
        navigate("/");
      }
    }
  }, [session, navigate, user?.role]);

  const handleDealerSubmit = async (values: DealerFormData) => {
    // Update form data state - all properties are guaranteed to exist now
    setFormData(values);

    // Sign in with Google
    const success = await signInWithGoogle(`${window.location.origin}/auth`);
    
    // If sign-in is successful and we have a user, register them as a dealer
    if (success && user) {
      await registerDealer(user.id, values);
      navigate("/dashboard/dealer");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4 space-y-4">
        <h1 className="text-3xl font-bold text-center">
          {isDealer ? "Register as Dealer" : "Sign In / Sign Up"}
        </h1>

        {isDealer ? (
          <DealerRegistrationForm 
            onSubmit={handleDealerSubmit} 
            isLoading={isLoading} 
          />
        ) : (
          <StandardAuth
            supabaseClient={supabaseClient}
            redirectTo={`${window.location.origin}/auth`}
          />
        )}

        <Button
          variant="link"
          onClick={() => setIsDealer(!isDealer)}
          className="w-full"
        >
          {isDealer
            ? "Back to Sign In / Sign Up"
            : "Register as a Dealer instead"}
        </Button>
      </div>
    </div>
  );
};

export default AuthPage;
