
/**
 * Changes made:
 * - 2024-06-26: Created component for basic email/password authentication
 * - 2024-06-27: Updated styles to match application theme
 * - 2024-06-29: Removed redundant sign-up text/link since we have register tab at the top
 * - 2024-06-29: Added forgot password option under sign in button
 */

import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface StandardAuthProps {
  redirectTo?: string;
}

export const StandardAuth = ({ redirectTo }: StandardAuthProps) => {
  const supabaseClient = useSupabaseClient();

  return (
    <Auth
      supabaseClient={supabaseClient}
      appearance={{
        theme: ThemeMinimal,
        variables: {
          default: {
            colors: {
              brand: '#DC143C',
              brandAccent: '#DC143C',
              inputLabelText: '#6A6A77',
              inputText: '#222020',
              inputBackground: 'white',
              inputBorder: '#E2E8F0',
              inputBorderFocus: '#DC143C',
              inputBorderHover: '#DC143C',
              anchorTextHoverColor: '#4B4DED'
            },
            fonts: {
              bodyFontFamily: "'Kanit', sans-serif",
              buttonFontFamily: "'Oswald', sans-serif",
              inputFontFamily: "'Kanit', sans-serif",
              labelFontFamily: "'Kanit', sans-serif"
            },
            fontSizes: {
              baseBodySize: '16px',
              baseInputSize: '16px',
              baseLabelSize: '14px',
              baseButtonSize: '18px'
            },
            space: {
              inputPadding: '12px 16px',
              buttonPadding: '12px 24px',
            },
            borderWidths: {
              buttonBorderWidth: '1px',
              inputBorderWidth: '1px',
            },
            radii: {
              buttonBorderRadius: '6px',
              inputBorderRadius: '6px',
            }
          }
        },
        style: {
          button: {
            fontWeight: '500',
            textTransform: 'uppercase',
          },
          anchor: {
            color: '#4B4DED',
          },
          message: {
            color: '#DC143C',
          },
          container: {
            width: '100%'
          }
        },
      }}
      magicLink={false}
      providers={[]}
      redirectTo={redirectTo}
      view="sign_in"
      showLinks={true}
    />
  );
};
