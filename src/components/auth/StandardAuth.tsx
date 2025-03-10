
/**
 * Changes made:
 * - 2024-03-28: Created StandardAuth component
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
      appearance={{ theme: { default: {} } }}
      providers={["google"]}
      redirectTo={redirectTo}
    />
  );
};
