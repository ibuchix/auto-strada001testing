import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export const Navigation = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (session) {
      const fetchUserRole = async () => {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          setUserRole(profile.role);
        }
      };

      fetchUserRole();
    }
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const NavLinks = () => (
    <>
      <Link to="/sellers" className="text-secondary hover:text-primary transition-colors">
        Sellers
      </Link>
      <Link to="/dealers" className="text-secondary hover:text-primary transition-colors">
        Dealers
      </Link>
      <Link to="/faq" className="text-secondary hover:text-primary transition-colors">
        FAQ
      </Link>
      <Link to="/partners" className="text-secondary hover:text-primary transition-colors">
        Partners
      </Link>
      {session ? (
        <>
          {userRole && (
            <Link 
              to={`/dashboard/${userRole}`} 
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Dashboard
            </Link>
          )}
          <Button 
            variant="outline" 
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </>
      ) : (
        <Link to="/auth">
          <Button 
            variant="outline" 
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
          >
            Sign In
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/1fc7ba28-ad84-400a-97d2-4051a417b224.png" 
              alt="Auto-Strada Logo" 
              className="h-12" 
            />
          </Link>
          
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="hidden md:flex items-center space-x-8">
              <NavLinks />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};