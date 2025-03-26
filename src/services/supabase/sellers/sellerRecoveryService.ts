
/**
 * Changes made:
 * - 2024-05-16: Created service for diagnosing and repairing seller registration issues
 * - 2024-08-19: Updated repairSellerRegistration to return a detailed result object
 * - 2025-12-01: Fixed supabase client import and RPC function call
 */

import { BaseService } from "../baseService";
import { sellerProfileService } from "./sellerProfileService";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";

/**
 * Interface for seller registration diagnosis results
 */
interface SellerRegistrationDiagnosis {
  metadataHasRole: boolean;
  profileHasRole: boolean;
  sellerRecordExists: boolean;
  isComplete: boolean;
  details: Record<string, any>;
}

/**
 * Interface for the repair result
 */
export interface RegistrationRepairResult {
  success: boolean;
  repaired: boolean;
  diagnosisDetails: {
    repairActions: string[];
    beforeRepair: SellerRegistrationDiagnosis | null;
    afterRepair: SellerRegistrationDiagnosis | null;
  };
}

/**
 * Service for repairing seller registration issues
 */
export class SellerRecoveryService extends BaseService {
  /**
   * Diagnoses issues with a seller's registration
   * Checks all possible data sources to identify inconsistencies
   */
  async diagnoseSellerRegistration(userId: string): Promise<SellerRegistrationDiagnosis> {
    console.log("SellerRecoveryService: Diagnosing seller registration for", userId);
    
    const diagnosis: SellerRegistrationDiagnosis = {
      metadataHasRole: false,
      profileHasRole: false,
      sellerRecordExists: false,
      isComplete: false,
      details: {}
    };
    
    try {
      // Check user metadata
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("SellerRecoveryService: Error getting user", userError);
        diagnosis.details.userError = userError.message;
      } else if (userData?.user) {
        diagnosis.metadataHasRole = userData.user.user_metadata?.role === 'seller';
        diagnosis.details.metadata = userData.user.user_metadata;
      }
      
      // Check profile table
      try {
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileError) {
          console.error("SellerRecoveryService: Error getting profile", profileError);
          diagnosis.details.profileError = profileError.message;
        } else if (profile) {
          diagnosis.profileHasRole = profile.role === 'seller';
          diagnosis.details.profile = profile;
        }
      } catch (e) {
        console.error("SellerRecoveryService: Exception getting profile", e);
        diagnosis.details.profileException = e;
      }
      
      // Check sellers table
      try {
        const { data: seller, error: sellerError } = await this.supabase
          .from('sellers')
          .select('user_id, verification_status, is_verified')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (sellerError) {
          console.error("SellerRecoveryService: Error getting seller", sellerError);
          diagnosis.details.sellerError = sellerError.message;
        } else if (seller) {
          diagnosis.sellerRecordExists = true;
          diagnosis.details.seller = seller;
        }
      } catch (e) {
        console.error("SellerRecoveryService: Exception getting seller", e);
        diagnosis.details.sellerException = e;
      }
      
      // Determine if registration is complete
      diagnosis.isComplete = 
        diagnosis.metadataHasRole && 
        diagnosis.profileHasRole && 
        diagnosis.sellerRecordExists;
      
      return diagnosis;
    } catch (error) {
      console.error("SellerRecoveryService: Error during diagnosis", error);
      diagnosis.details.diagnosisError = error;
      return diagnosis;
    }
  }
  
  /**
   * Completely repairs a seller's registration by ensuring all data is consistent
   * This is a more thorough approach than the standard registerSeller function
   */
  async repairSellerRegistration(userId: string): Promise<RegistrationRepairResult> {
    console.log("SellerRecoveryService: Repairing seller registration for", userId);
    
    const result: RegistrationRepairResult = {
      success: false,
      repaired: false,
      diagnosisDetails: {
        repairActions: [],
        beforeRepair: null,
        afterRepair: null
      }
    };
    
    try {
      // Add debounce to prevent rapid consecutive repairs
      const now = Date.now();
      const lastRepair = parseInt(localStorage.getItem('lastSellerRepair') || '0');
      
      if (now - lastRepair < 5000) { // 5 second debounce
        console.log("SellerRecoveryService: Repair attempted too soon, debouncing");
        return {
          success: false,
          repaired: false,
          diagnosisDetails: {
            repairActions: ["Repair blocked due to debouncing"],
            beforeRepair: null,
            afterRepair: null
          }
        };
      }
      
      localStorage.setItem('lastSellerRepair', now.toString());
      
      // Diagnose before repair
      const beforeDiagnosis = await this.diagnoseSellerRegistration(userId);
      result.diagnosisDetails.beforeRepair = beforeDiagnosis;
      
      // If already complete, no need to repair
      if (beforeDiagnosis.isComplete) {
        return {
          success: true,
          repaired: false,
          diagnosisDetails: {
            repairActions: ["No repairs needed - registration is already complete"],
            beforeRepair: beforeDiagnosis,
            afterRepair: beforeDiagnosis
          }
        };
      }
      
      // Step 1: Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          role: 'seller',
          is_verified: true
        }
      });
      
      if (metadataError) {
        console.error("SellerRecoveryService: Failed to update metadata", metadataError);
        result.diagnosisDetails.repairActions.push("Failed to update user metadata");
      } else {
        console.log("SellerRecoveryService: Updated user metadata successfully");
        result.diagnosisDetails.repairActions.push("Updated user metadata with seller role");
      }
      
      // Step 2: Ensure profile table has correct role
      const { error: profileError } = await this.supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          role: 'seller',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
        
      if (profileError) {
        console.error("SellerRecoveryService: Failed to update profile", profileError);
        result.diagnosisDetails.repairActions.push("Failed to update profile");
      } else {
        console.log("SellerRecoveryService: Updated profile successfully");
        result.diagnosisDetails.repairActions.push("Updated profile with seller role");
      }
      
      // Step 3: Ensure seller record exists with verified status
      const { error: sellerError } = await this.supabase
        .from('sellers')
        .upsert({
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          verification_status: 'verified',
          is_verified: true
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
        
      if (sellerError) {
        console.error("SellerRecoveryService: Failed to update seller record", sellerError);
        result.diagnosisDetails.repairActions.push("Failed to update seller record");
      } else {
        console.log("SellerRecoveryService: Updated seller record successfully");
        result.diagnosisDetails.repairActions.push("Created/updated seller record with verified status");
      }
      
      // Step 4: Try the security definer function if available
      try {
        // Use conditionally called RPC to avoid type errors when function doesn't exist
        const rpcName = 'register_seller';
        await this.supabase.rpc(rpcName as any, {
          p_user_id: userId
        });
        console.log("SellerRecoveryService: Called register_seller RPC");
        result.diagnosisDetails.repairActions.push("Called register_seller RPC function");
      } catch (rpcError) {
        console.error("SellerRecoveryService: RPC call failed", rpcError);
        result.diagnosisDetails.repairActions.push("Security definer function call failed (non-critical)");
      }
      
      // Step 5: Update the cache to ensure consistent state
      saveToCache(CACHE_KEYS.USER_PROFILE, {
        id: userId,
        role: 'seller',
        updated_at: new Date().toISOString()
      });
      result.diagnosisDetails.repairActions.push("Updated cache with seller role");
      
      // Verify the repair worked
      const afterDiagnosis = await this.diagnoseSellerRegistration(userId);
      result.diagnosisDetails.afterRepair = afterDiagnosis;
      
      result.success = afterDiagnosis.isComplete;
      result.repaired = result.success && !beforeDiagnosis.isComplete;
      
      return result;
    } catch (error) {
      console.error("SellerRecoveryService: Error during repair", error);
      result.diagnosisDetails.repairActions.push(`Repair failed with error: ${error}`);
      return result;
    }
  }
}

// Export singleton instance
export const sellerRecoveryService = new SellerRecoveryService();
