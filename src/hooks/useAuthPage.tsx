
/**
 * Changes made:
 * - 2024-06-26: Created hook to handle auth page logic
 * - 2024-06-28: Removed dealer-specific logic to make app seller-specific
 * - 2024-07-05: Updated to use proper seller registration with profiles table
 * - 2024-12-18: Enhanced registration flow with better error handling and role assignment
 */

import { useState, useEffect } from "react";
import { useSession, useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthActions } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAuthPage = () => {
  const [isSeller, setIsSeller] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'initial' | 'processing' | 'complete'>('initial');
  
  const session = useSession();
  const user = useUser();
  const navigate = useNavigate();
  const { isLoading, registerSeller } = useAuthActions();

  useEffect(() => {
    if (session) {
      const checkUserRole = async () => {
        try {
          console.log("Checking user role with session:", session);
          
          // Check if user has a role in metadata
          if (user?.user_metadata?.role === "seller") {
            console.log("User has seller role in metadata");
            navigate("/dashboard/seller");
            return;
          }

          // If not in metadata, check profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user?.id)
            .single();

          console.log("Profile check result:", { profile, error });

          if (!error && profile && profile.role === 'seller') {
            console.log("User has seller role in profiles table");
            
            // Update metadata to match profile for consistency
            await supabase.auth.updateUser({
              data: { role: 'seller' }
            });
            
            navigate("/dashboard/seller");
          }
        } catch (err) {
          console.error("Error checking user role:", err);
        }
      };

      checkUserRole();
    }
  }, [session, navigate, user]);

  const handleSellerSubmit = async (email: string, password: string) => {
    try {
      setRegistrationStep('processing');
      console.log("Starting seller registration for:", email);
      
      // Step 1: Sign up the user
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'seller'
          }
        }
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        toast.error(signUpError.message);
        setRegistrationStep('initial');
        return;
      }

      console.log("User signed up successfully:", signUpData);
      
      // Step 2: Sign in the user automatically
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error("Sign in error after registration:", signInError);
        toast.error("Registration successful but couldn't sign in automatically. Please sign in manually.");
        setRegistrationStep('initial');
        return;
      }
      
      console.log("User signed in after registration:", data);
      
      if (data?.user) {
        // Step 3: Register as seller to ensure profile and seller records exist
        console.log("Attempting to register user as seller:", data.user.id);
        const registerResult = await registerSeller(data.user.id);
        
        if (registerResult) {
          console.log("Seller registration successful, redirecting to dashboard");
          toast.success("Registration successful! Welcome to your seller dashboard.");
          setRegistrationStep('complete');
          navigate("/dashboard/seller");
        } else {
          console.error("Failed to register as seller after account creation");
          toast.error("Account created but seller registration failed. Please contact support.");
          setRegistrationStep('initial');
        }
      }
    } catch (error: any) {
      console.error("Registration process error:", error);
      toast.error(error.message || "Registration failed");
      setRegistrationStep('initial');
    }
  };

  const resetRegistrationState = () => {
    setIsSeller(false);
    setRegistrationStep('initial');
  };

  return {
    isSeller,
    isLoading,
    registrationStep,
    setIsSeller,
    handleSellerSubmit,
    resetRegistrationState
  };
};
