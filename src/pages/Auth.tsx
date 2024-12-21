import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        toast({
          title: "Welcome!",
          description: "You have successfully signed in.",
        });
        navigate("/");
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
              view="sign_up"
              additionalData={{
                role: {
                  type: 'select',
                  options: [
                    { label: 'Buyer', value: 'buyer' },
                    { label: 'Seller', value: 'seller' },
                    { label: 'Dealer', value: 'dealer' }
                  ],
                  required: true,
                  label: 'Select your role'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;