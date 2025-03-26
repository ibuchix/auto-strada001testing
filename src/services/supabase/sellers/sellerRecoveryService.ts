/**
 * Service for recovering seller accounts
 * Changes made:
 * - 2025-12-12: Fixed supabase client import and property access
 */

import { supabase } from "@/integrations/supabase/client";
import { auditLogService } from "../auditLogService";

export const sellerRecoveryService = {
  async recoverSellerAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if a seller record exists
      const { data: sellerRecord, error: sellerError } = await supabase
        .from('sellers')
        .select('id, is_verified')
        .eq('user_id', userId)
        .single();

      if (sellerError) {
        console.error("Error fetching seller record:", sellerError);
        return { success: false, error: "Could not retrieve seller record" };
      }

      // If seller record exists and is verified, no recovery needed
      if (sellerRecord && sellerRecord.is_verified) {
        console.log("Seller account is already active and verified");
        return { success: true };
      }

      // If seller record exists but is not verified, attempt to verify
      if (sellerRecord && !sellerRecord.is_verified) {
        const { error: updateError } = await supabase
          .from('sellers')
          .update({ is_verified: true })
          .eq('user_id', userId);

        if (updateError) {
          console.error("Error updating seller record:", updateError);
          return { success: false, error: "Could not update seller verification status" };
        }

        console.log("Seller account verification updated successfully");
      }

      // If no seller record exists, create one
      if (!sellerRecord) {
        const { error: insertError } = await supabase
          .from('sellers')
          .insert({ user_id: userId, is_verified: true });

        if (insertError) {
          console.error("Error creating seller record:", insertError);
          return { success: false, error: "Could not create seller record" };
        }

        console.log("Seller record created successfully");
      }

      // Log the recovery action
      await auditLogService.logAction("update_user_role", userId, { 
        message: "Seller account recovered", 
        recoveryMethod: "system" 
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error recovering seller account:", error);
      return { success: false, error: error.message || "Failed to recover seller account" };
    }
  }
};
