
/**
 * Utilities for updating user metadata during registration
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Updates user metadata with seller role
 */
export const updateUserMetadata = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<boolean> => {
  try {
    console.log("Updating user metadata with seller role");
    const { error: metadataError } = await supabaseClient.auth.updateUser({
      data: { role: 'seller' }
    });

    if (metadataError) {
      console.error("Error updating user metadata:", metadataError);
      return false;
    } else {
      console.log("Successfully updated user metadata with seller role");
      return true;
    }
  } catch (metadataError) {
    console.error("Exception updating user metadata:", metadataError);
    return false;
  }
};
