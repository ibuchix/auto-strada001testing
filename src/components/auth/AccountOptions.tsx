
/**
 * Changes made:
 * - 2024-06-26: Created component for sign-in/sign-up options
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StandardAuth } from "@/components/auth/StandardAuth";

interface AccountOptionsProps {
  onSellerRegister: () => void;
  onDealerRegister: () => void;
}

export const AccountOptions = ({
  onSellerRegister,
  onDealerRegister
}: AccountOptionsProps) => {
  return (
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
            onClick={onSellerRegister} 
            className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-oswald"
          >
            Register as a Seller
          </Button>
          
          <Button 
            onClick={onDealerRegister} 
            variant="outline" 
            className="w-full border-2 border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C] hover:text-white font-oswald"
          >
            Register as a Dealer
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
