import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

export const Navigation = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/73e3d564-2962-4f87-ac08-8949a33b0d8d.png" 
              alt="Auto-Strada Logo" 
              className="h-8" 
            />
            <span className="text-xl font-bold text-[#DC143C] tracking-tight font-kanit">Auto-Strada</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {session && profile?.role === 'seller' && (
              <Link 
                to="/seller/dashboard" 
                className="text-[#6A6A77] hover:text-[#DC143C] transition-colors font-kanit"
              >
                Seller Dashboard
              </Link>
            )}
            {session && profile?.role === 'dealer' && (
              <Link 
                to="/dealer/dashboard" 
                className="text-[#6A6A77] hover:text-[#DC143C] transition-colors font-kanit"
              >
                Dealer Dashboard
              </Link>
            )}
            {session && profile?.role === 'buyer' && (
              <Link 
                to="/buyer/dashboard" 
                className="text-[#6A6A77] hover:text-[#DC143C] transition-colors font-kanit"
              >
                Buyer Dashboard
              </Link>
            )}
            <Link 
              to="/marketplace" 
              className="text-[#6A6A77] hover:text-[#DC143C] transition-colors font-kanit"
            >
              Marketplace
            </Link>
            {session ? (
              <Button 
                variant="outline" 
                className="border-2 border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C] hover:text-white transition-colors font-kanit"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="border-2 border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C] hover:text-white transition-colors font-kanit"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};