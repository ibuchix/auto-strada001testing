
/**
 * Changes made:
 * - 2024-03-28: Created StandardAuth component
 * - 2024-06-25: Fixed styling and appearance to match project style guide
 * - 2024-06-25: Fixed type error by using correct theme property names
 */

import { Auth } from "@supabase/auth-ui-react";
import { SupabaseClient } from "@supabase/supabase-js";

interface StandardAuthProps {
  supabaseClient: SupabaseClient;
  redirectTo: string;
}

export const StandardAuth = ({ 
  supabaseClient, 
  redirectTo 
}: StandardAuthProps) => {
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
              inputLabelText: '#6A6A77', // Changed from inputLabel to inputLabelText
              inputBorder: '#ECF1F4',
              inputBackground: '#FFFFFF',
              buttonText: '#FFFFFF',
              anchorTextColor: '#4B4DED', // Changed from linkText to anchorTextColor
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
