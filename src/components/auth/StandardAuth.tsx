
/**
 * Changes made:
 * - 2024-03-28: Created StandardAuth component
 * - 2024-06-25: Fixed styling and appearance to match project style guide
 * - 2024-06-25: Fixed type error by using correct theme property names
 * - 2024-06-25: Fixed buttonText to defaultButtonText to match Supabase theme type
 * - 2024-06-26: Updated to use useSupabaseClient hook instead of requiring client as prop
 */

import { Auth } from "@supabase/auth-ui-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

interface StandardAuthProps {
  redirectTo: string;
}

export const StandardAuth = ({ 
  redirectTo 
}: StandardAuthProps) => {
  const supabaseClient = useSupabaseClient();
  
  return (
    <Auth
      supabaseClient={supabaseClient}
      appearance={{ 
        theme: { 
          default: {
            colors: {
              brand: '#DC143C',
              brandAccent: '#383B39',
              inputText: '#222020',
              inputLabelText: '#6A6A77',
              inputBorder: '#ECF1F4',
              inputBackground: '#FFFFFF',
              defaultButtonText: '#FFFFFF',
              anchorTextColor: '#4B4DED',
              dividerBackground: '#ECF1F4',
            },
            fonts: {
              bodyFontFamily: 'Kanit, sans-serif',
              buttonFontFamily: 'Oswald, sans-serif',
              inputFontFamily: 'Kanit, sans-serif',
              labelFontFamily: 'Kanit, sans-serif',
            },
          }
        } 
      }}
      providers={["google"]}
      redirectTo={redirectTo}
    />
  );
};
