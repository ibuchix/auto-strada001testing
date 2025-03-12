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
 */

import { useState, useEffect } from "react";
import {
  useSession,
  useUser,
} from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealerRegistrationForm, DealerFormData } from "@/components/auth/DealerRegistrationForm";
import { SellerRegistrationForm } from "@/components/auth/SellerRegistrationForm";
import { StandardAuth } from "@/components/auth/StandardAuth";
import { useAuthActions, DealerData } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
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

  if (isSeller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-4 space-y-4">
          <h1 className="text-3xl font-bold text-center font-kanit text-[#222020]">Register as Seller</h1>
          
          <SellerRegistrationForm onSubmit={handleSellerSubmit} isLoading={isLoading} />
          
          <Button
            variant="link"
            onClick={() => {
              setIsSeller(false);
              setIsDealer(false);
            }}
            className="w-full text-[#4B4DED]"
          >
            Back to Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  if (isDealer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md p-4 space-y-4">
          <h1 className="text-3xl font-bold text-center font-kanit text-[#222020]">Register as Dealer</h1>
          
          <DealerRegistrationForm 
            onSubmit={handleDealerSubmit} 
            isLoading={isLoading} 
          />
          
          <Button
            variant="link"
            onClick={() => {
              setIsDealer(false);
              setIsSeller(false);
            }}
            className="w-full text-[#4B4DED]"
          >
            Back to Sign In / Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4 space-y-4">
        <h1 className="text-3xl font-bold text-center font-kanit text-[#222020]">Sign In / Sign Up</h1>
        
        <Tabs defaultValue="auth" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auth">Sign In / Sign Up</TabsTrigger>
            <TabsTrigger value="register">Register As</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auth" className="mt-4">
            <StandardAuth
              redirectTo={`${window.location.origin}/auth`}
            />
          </TabsContent>
          
          <TabsContent value="register" className="mt-4 space-y-4">
            <Button 
              onClick={() => setIsSeller(true)} 
              className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-oswald"
            >
              Register as a Seller
            </Button>
            
            <Button 
              onClick={() => setIsDealer(true)} 
              variant="outline" 
              className="w-full border-2 border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C] hover:text-white font-oswald"
            >
              Register as a Dealer
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
