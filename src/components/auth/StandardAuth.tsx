
/**
 * Changes made:
 * - 2024-03-28: Created StandardAuth component
 * - 2024-06-25: Fixed styling and appearance to match project style guide
 * - 2024-06-25: Fixed type error by using correct theme property names
 * - 2024-06-25: Fixed buttonText to defaultButtonText to match Supabase theme type
 * - 2024-06-26: Updated to use useSupabaseClient hook instead of requiring client as prop
 * - 2024-06-27: Improved styling to match modern design principles
 * - 2024-06-28: Fixed theme type errors by using correct property names for borderWidths and radii
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
              brandAccent: '#c01236',
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
            space: {
              inputPadding: '12px 16px',
              buttonPadding: '12px 24px',
            },
            borderWidths: {
              buttonBorderWidth: '0px',
              inputBorderWidth: '1px',
            },
            radii: {
              buttonBorderRadius: '6px',
              inputBorderRadius: '6px',
            },
          }
        },
        style: {
          button: {
            fontSize: '16px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)',
            boxShadow: '0 2px 10px rgba(220, 20, 60, 0.1)',
          },
          anchor: {
            fontWeight: '500',
            fontSize: '15px',
            textDecoration: 'none',
          },
          container: {
            padding: '24px 0',
          },
          label: {
            fontWeight: '500',
            marginBottom: '8px',
            fontSize: '15px',
          },
          input: {
            fontSize: '15px',
            marginBottom: '16px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          },
          message: {
            fontWeight: '400',
            fontSize: '14px',
            marginBottom: '12px',
          },
          divider: {
            margin: '24px 0',
          },
        },
        className: {
          container: 'auth-container',
          button: 'auth-button',
          anchor: 'auth-link',
          divider: 'auth-divider',
          input: 'auth-input',
          label: 'auth-label',
          message: 'auth-message',
        },
      }}
      providers={["google"]}
      redirectTo={redirectTo}
    />
  );
};
