
/**
 * Changes made:
 * - 2024-03-19: Fixed text display and removed unintended content
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const syncLocalValuations = async (userId: string) => {
    const localValuations = JSON.parse(localStorage.getItem('carValuations') || '[]');
    
    if (localValuations.length > 0) {
      for (const valuation of localValuations) {
        const { error: insertError } = await supabase
          .from('cars')
          .insert({
            seller_id: userId,
            title: `${valuation.make} ${valuation.model} ${valuation.year}`,
            registration_number: valuation.registration,
            make: valuation.make,
            model: valuation.model,
            year: valuation.year,
            valuation_data: valuation,
            vin: 'PENDING',
            mileage: 0,
            price: valuation.valuation
          });

        if (insertError) {
          console.error('Error syncing valuation:', insertError);
          toast({
            title: "Sync Error",
            description: "Failed to sync some valuations. Please try again later.",
            variant: "destructive",
          });
          return;
        }
      }

      localStorage.removeItem('carValuations');
      toast({
        title: "Valuations Synced",
        description: "Your previous car valuations have been synced to your account.",
      });
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // If the user is a dealer, create their dealer record
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'dealer') {
          const { error: dealerError } = await supabase
            .from('dealers')
            .insert({
              user_id: session.user.id,
              dealership_name: session.user.email?.split('@')[0] || 'New Dealership',
              license_number: 'PENDING',
              supervisor_name: 'Pending Update',
              tax_id: 'PENDING',
              business_registry_number: 'PENDING'
            });

          if (dealerError) {
            console.error('Error creating dealer record:', dealerError);
            toast({
              title: "Error",
              description: "Failed to create dealer profile. Please contact support.",
              variant: "destructive",
            });
            return;
          }
        }

        await syncLocalValuations(session.user.id);

        toast({
          title: "Welcome!",
          description: "You have successfully signed in.",
        });
        navigate("/");
      } else if (event === "SIGNED_OUT") {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-primary mb-6 text-center font-kanit">
              Welcome to Auto-Strada
            </h2>
            <p className="text-secondary mb-8 text-center">
              Sign in to your account or create a new one
            </p>
            <SupabaseAuth 
              supabaseClient={supabase} 
              appearance={{ 
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#DC143C',
                      brandAccent: '#383B39',
                      brandButtonText: 'white',
                    },
                    borderWidths: {
                      inputBorderWidth: '1px',
                      buttonBorderWidth: '2px',
                    },
                    radii: {
                      buttonBorderRadius: '0.5rem',
                      inputBorderRadius: '0.5rem',
                    },
                    fonts: {
                      bodyFontFamily: 'Kanit, sans-serif',
                      buttonFontFamily: 'Kanit, sans-serif',
                      inputFontFamily: 'Kanit, sans-serif',
                      labelFontFamily: 'Kanit, sans-serif',
                    },
                  },
                },
                className: {
                  button: 'bg-primary hover:bg-secondary transition-colors duration-200',
                  input: 'border-gray-300 focus:border-primary',
                  label: 'text-secondary font-medium',
                },
              }}
              providers={[]}
              redirectTo={window.location.origin}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
