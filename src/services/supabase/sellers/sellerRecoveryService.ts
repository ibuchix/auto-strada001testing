
/**
 * Changes made:
 * - 2024-05-16: Created service for diagnosing and repairing seller registration issues
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
  async repairSellerRegistration(userId: string): Promise<boolean> {
    console.log("SellerRecoveryService: Repairing seller registration for", userId);
    
    try {
      // Add debounce to prevent rapid consecutive repairs
      const now = Date.now();
      const lastRepair = parseInt(localStorage.getItem('lastSellerRepair') || '0');
      
      if (now - lastRepair < 5000) { // 5 second debounce
        console.log("SellerRecoveryService: Repair attempted too soon, debouncing");
        return false;
      }
      
      localStorage.setItem('lastSellerRepair', now.toString());
      
      // Step 1: Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          role: 'seller',
          is_verified: true
        }
      });
      
      if (metadataError) {
        console.error("SellerRecoveryService: Failed to update metadata", metadataError);
      } else {
        console.log("SellerRecoveryService: Updated user metadata successfully");
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
      } else {
        console.log("SellerRecoveryService: Updated profile successfully");
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
      } else {
        console.log("SellerRecoveryService: Updated seller record successfully");
      }
      
      // Step 4: Try the security definer function as a final measure
      try {
        await this.supabase.rpc('ensure_seller_status', {
          p_user_id: userId
        });
        console.log("SellerRecoveryService: Called ensure_seller_status RPC");
      } catch (rpcError) {
        console.error("SellerRecoveryService: RPC call failed", rpcError);
      }
      
      // Step 5: Update the cache to ensure consistent state
      saveToCache(CACHE_KEYS.USER_PROFILE, {
        id: userId,
        role: 'seller',
        updated_at: new Date().toISOString()
      });
      
      // Verify the repair worked
      const diagnosis = await this.diagnoseSellerRegistration(userId);
      return diagnosis.isComplete;
    } catch (error) {
      console.error("SellerRecoveryService: Error during repair", error);
      return false;
    }
  }
}

// Export singleton instance
export const sellerRecoveryService = new SellerRecoveryService();
