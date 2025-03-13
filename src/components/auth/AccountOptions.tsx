
/**
 * Changes made:
 * - 2024-06-26: Created component for sign-in/sign-up options
 * - 2024-06-27: Redesigned for modern appearance with card-based layout
 * - 2024-06-28: Fixed BuildingStore icon error, replacing with Store icon
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StandardAuth } from "@/components/auth/StandardAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, UserPlus, Store } from "lucide-react";

interface AccountOptionsProps {
  onSellerRegister: () => void;
  onDealerRegister: () => void;
}

export const AccountOptions = ({
  onSellerRegister,
  onDealerRegister
}: AccountOptionsProps) => {
  return (
    <Card className="w-full max-w-md border-none shadow-lg animate-fade-in">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-3xl font-bold text-center font-kanit text-[#222020]">Sign In / Sign Up</CardTitle>
        <CardDescription className="text-subtitle text-center">
          Access your account or create a new one
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="auth" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="auth" className="font-oswald">Sign In / Sign Up</TabsTrigger>
            <TabsTrigger value="register" className="font-oswald">Register As</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auth" className="mt-4 space-y-4">
            <div className="p-4 rounded-lg bg-accent/40">
              <StandardAuth
                redirectTo={`${window.location.origin}/auth`}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="mt-4 space-y-6">
            <div className="space-y-4">
              <Button 
                onClick={onSellerRegister} 
                className="w-full h-14 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-oswald text-lg group relative overflow-hidden"
              >
                <span className="flex items-center gap-2">
                  <UserPlus size={20} />
                  Register as a Seller
                </span>
                <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" size={18} />
              </Button>
              
              <Button 
                onClick={onDealerRegister} 
                variant="outline" 
                className="w-full h-14 border-2 border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C] hover:text-white font-oswald text-lg group relative overflow-hidden"
              >
                <span className="flex items-center gap-2">
                  <Store size={20} />
                  Register as a Dealer
                </span>
                <ArrowRight className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" size={18} />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
