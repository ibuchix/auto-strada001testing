
/**
 * Changes made:
 * - 2024-06-26: Created hook to handle auth page logic
 * - 2024-06-28: Removed dealer-specific logic to make app seller-specific
 * - 2024-07-05: Updated to use proper seller registration with profiles table
 */

import { useState, useEffect } from "react";
import { useSession, useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthActions } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAuthPage = () => {
  const [isSeller, setIsSeller] = useState(false);
  
  const session = useSession();
  const user = useUser();
  const navigate = useNavigate();
  const { isLoading, registerSeller } = useAuthActions();

  useEffect(() => {
    if (session) {
      const checkUserRole = async () => {
        // Check if user has a role in metadata
        if (user?.user_metadata?.role === "seller") {
          navigate("/dashboard/seller");
          return;
        }

        // If not in metadata, check profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .single();

        if (!error && profile && profile.role === 'seller') {
          navigate("/dashboard/seller");
        }
      };

      checkUserRole();
    }
  }, [session, navigate, user]);

  const handleSellerSubmit = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'seller'
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Registration successful! You can now sign in.");
      
      // Auto sign in after registration
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        toast.error("Registration successful but couldn't sign in automatically. Please sign in manually.");
        return;
      }
      
      if (data?.user) {
        await registerSeller(data.user.id);
        navigate("/dashboard/seller");
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    }
  };

  const resetRegistrationState = () => {
    setIsSeller(false);
  };

  return {
    isSeller,
    isLoading,
    setIsSeller,
    handleSellerSubmit,
    resetRegistrationState
  };
};
