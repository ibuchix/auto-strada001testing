
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavLinks } from "./navigation/NavLinks";
import { MobileNav } from "./navigation/MobileNav";

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

  return (
    <nav className="sticky top-0 w-full bg-white shadow-sm z-50">
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
            <MobileNav 
              userRole={userRole} 
              onSignOut={handleSignOut} 
              session={!!session} 
            />
          ) : (
            <div className="hidden md:flex items-center space-x-8">
              <NavLinks 
                userRole={userRole} 
                onSignOut={handleSignOut} 
                session={!!session} 
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
