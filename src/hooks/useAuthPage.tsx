
/**
 * Changes made:
 * - 2024-06-26: Created hook to handle auth page logic
 */

import { useState, useEffect } from "react";
import { useSession, useUser } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DealerFormData } from "@/components/auth/DealerRegistrationForm";
import { useAuthActions, DealerData } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAuthPage = () => {
  const [isDealer, setIsDealer] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [formData, setFormData] = useState<DealerData>({
    dealershipName: "",
    licenseNumber: "",
    supervisorName: "",
    taxId: "",
    businessRegNumber: "",
    address: "",
  });
  
  const session = useSession();
  const user = useUser();
  const navigate = useNavigate();
  const { isLoading, registerDealer, registerSeller, signInWithGoogle } = useAuthActions();

  useEffect(() => {
    if (session) {
      if (user?.user_metadata?.role === "dealer") {
        navigate("/dashboard/dealer");
      } else if (user?.user_metadata?.role === "seller") {
        navigate("/dashboard/seller");
      }
    }
  }, [session, navigate, user]);

  const handleDealerSubmit = async (values: DealerFormData) => {
    const dealerData: DealerData = {
      dealershipName: values.dealershipName,
      licenseNumber: values.licenseNumber,
      supervisorName: values.supervisorName,
      taxId: values.taxId,
      businessRegNumber: values.businessRegNumber,
      address: values.address
    };
    
    setFormData(dealerData);
    
    const success = await signInWithGoogle(`${window.location.origin}/auth`);
    
    if (success && user) {
      await registerDealer(user.id, dealerData);
      navigate("/dashboard/dealer");
    }
  };

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
    setIsDealer(false);
    setIsSeller(false);
  };

  return {
    isDealer,
    isSeller,
    isLoading,
    setIsDealer,
    setIsSeller,
    handleDealerSubmit,
    handleSellerSubmit,
    resetRegistrationState
  };
};
