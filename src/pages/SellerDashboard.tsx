import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeBids } from "@/hooks/useRealtimeBids";

const SellerDashboard = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initialize real-time bid notifications
  useRealtimeBids();

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }

    const checkRole = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to verify user role",
          variant: "destructive",
        });
        return;
      }

      if (profile.role !== 'seller') {
        navigate('/');
        toast({
          title: "Access Denied",
          description: "This page is only accessible to sellers",
          variant: "destructive",
        });
      }
    };

    checkRole();
  }, [session, navigate, toast]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-4xl font-bold text-primary mb-8">Seller Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-secondary mb-4">Your Listings</h2>
            <p className="text-muted-foreground">Your active vehicle listings will appear here.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-secondary mb-4">Recent Bids</h2>
            <p className="text-muted-foreground">Latest bids on your vehicles.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;