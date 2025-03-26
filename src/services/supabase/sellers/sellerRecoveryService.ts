
/**
 * Changes made:
 * - 2025-06-12: Created recovery service for repairing incomplete seller registrations
 */

import { BaseService } from "../baseService";
import { sellerVerificationService } from "./sellerVerificationService";

/**
 * Service for repairing incomplete or broken seller registrations
 */
export class SellerRecoveryService extends BaseService {
  /**
   * Scans for and repairs common seller registration issues
   * - Metadata set but no profiles record
   * - Profiles role set but no sellers record
   * - Sellers record exists but no role in metadata or profiles
   */
  async repairSellerRegistration(userId: string): Promise<{
    success: boolean;
    repaired: boolean;
    diagnosisDetails: {
      metadataHasRole: boolean;
      profileHasRole: boolean;
      sellerRecordExists: boolean;
      repairActions: string[];
    };
  }> {
    try {
      console.log("SellerRecoveryService: Starting registration diagnosis for user:", userId);
      
      const repairActions: string[] = [];
      let repairPerformed = false;
      
      // Step 1: Check current state across all data sources
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) {
        console.error("SellerRecoveryService: Error fetching user data:", userError);
        throw userError;
      }
      
      // Step 2: Check if user has seller role in metadata
      const metadataHasRole = userData?.user?.user_metadata?.role === 'seller';
      console.log("SellerRecoveryService: User metadata has seller role:", metadataHasRole);
      
      // Step 3: Check if profile has seller role
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error("SellerRecoveryService: Error checking profile:", profileError);
      }
      
      const profileHasRole = profile?.role === 'seller';
      console.log("SellerRecoveryService: Profile has seller role:", profileHasRole);
      
      // Step 4: Check if seller record exists
      const { data: seller, error: sellerError } = await this.supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (sellerError) {
        console.error("SellerRecoveryService: Error checking seller record:", sellerError);
      }
      
      const sellerRecordExists = !!seller;
      console.log("SellerRecoveryService: Seller record exists:", sellerRecordExists);
      
      // Step 5: Determine repair strategy based on diagnosis
      // Case 1: Everything is consistent - no repair needed
      if (metadataHasRole && profileHasRole && sellerRecordExists) {
        console.log("SellerRecoveryService: Registration is already complete, no repair needed");
        return {
          success: true,
          repaired: false,
          diagnosisDetails: {
            metadataHasRole,
            profileHasRole,
            sellerRecordExists,
            repairActions: ['No repair needed - registration already complete']
          }
        };
      }
      
      // Case 2: Metadata has role but other components missing
      if (metadataHasRole && (!profileHasRole || !sellerRecordExists)) {
        console.log("SellerRecoveryService: Metadata has role but other components missing - repairing");
        
        // Create/update profile if needed
        if (!profileHasRole) {
          console.log("SellerRecoveryService: Creating/updating profile with seller role");
          const { error: updateProfileError } = await this.supabase
            .from('profiles')
            .upsert({
              id: userId,
              role: 'seller',
              updated_at: new Date().toISOString()
            });
            
          if (updateProfileError) {
            console.error("SellerRecoveryService: Error updating profile:", updateProfileError);
          } else {
            repairActions.push('Updated profile with seller role');
            repairPerformed = true;
          }
        }
        
        // Create seller record if needed
        if (!sellerRecordExists) {
          console.log("SellerRecoveryService: Creating seller record");
          const { error: createSellerError } = await this.supabase
            .from('sellers')
            .insert({
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              verification_status: 'pending'
            });
            
          if (createSellerError) {
            console.error("SellerRecoveryService: Error creating seller record:", createSellerError);
          } else {
            repairActions.push('Created missing seller record');
            repairPerformed = true;
          }
        }
      } 
      
      // Case 3: Profile has role but other components missing
      else if (profileHasRole && (!metadataHasRole || !sellerRecordExists)) {
        console.log("SellerRecoveryService: Profile has role but other components missing - repairing");
        
        // Update metadata if needed
        if (!metadataHasRole) {
          console.log("SellerRecoveryService: Updating user metadata with seller role");
          const { error: updateUserError } = await this.supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          if (updateUserError) {
            console.error("SellerRecoveryService: Error updating user metadata:", updateUserError);
          } else {
            repairActions.push('Updated user metadata with seller role');
            repairPerformed = true;
          }
        }
        
        // Create seller record if needed
        if (!sellerRecordExists) {
          console.log("SellerRecoveryService: Creating seller record");
          const { error: createSellerError } = await this.supabase
            .from('sellers')
            .insert({
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              verification_status: 'pending'
            });
            
          if (createSellerError) {
            console.error("SellerRecoveryService: Error creating seller record:", createSellerError);
          } else {
            repairActions.push('Created missing seller record');
            repairPerformed = true;
          }
        }
      } 
      
      // Case 4: Only seller record exists
      else if (sellerRecordExists && (!metadataHasRole || !profileHasRole)) {
        console.log("SellerRecoveryService: Seller record exists but other components missing - repairing");
        
        // Update metadata if needed
        if (!metadataHasRole) {
          console.log("SellerRecoveryService: Updating user metadata with seller role");
          const { error: updateUserError } = await this.supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          if (updateUserError) {
            console.error("SellerRecoveryService: Error updating user metadata:", updateUserError);
          } else {
            repairActions.push('Updated user metadata with seller role');
            repairPerformed = true;
          }
        }
        
        // Update profile if needed
        if (!profileHasRole) {
          console.log("SellerRecoveryService: Creating/updating profile with seller role");
          const { error: updateProfileError } = await this.supabase
            .from('profiles')
            .upsert({
              id: userId,
              role: 'seller',
              updated_at: new Date().toISOString()
            });
            
          if (updateProfileError) {
            console.error("SellerRecoveryService: Error updating profile:", updateProfileError);
          } else {
            repairActions.push('Updated profile with seller role');
            repairPerformed = true;
          }
        }
      } 
      
      // Case 5: Nothing exists, complete registration from scratch
      else if (!metadataHasRole && !profileHasRole && !sellerRecordExists) {
        console.log("SellerRecoveryService: Nothing exists, performing full registration");
        
        // Try using RPC function first (most reliable method)
        try {
          console.log("SellerRecoveryService: Attempting registration via RPC function");
          const { error: rpcError } = await this.supabase.rpc('register_seller', {
            p_user_id: userId
          });
          
          if (!rpcError) {
            console.log("SellerRecoveryService: RPC registration successful");
            repairActions.push('Performed complete registration using RPC function');
            repairPerformed = true;
          } else {
            console.error("SellerRecoveryService: RPC registration failed:", rpcError);
            
            // Manual registration steps if RPC fails
            console.log("SellerRecoveryService: Falling back to manual registration");
            
            // Update metadata
            const { error: updateUserError } = await this.supabase.auth.updateUser({
              data: { role: 'seller' }
            });
            
            if (updateUserError) {
              console.error("SellerRecoveryService: Error updating user metadata:", updateUserError);
            } else {
              repairActions.push('Updated user metadata with seller role');
              repairPerformed = true;
            }
            
            // Create/update profile
            const { error: updateProfileError } = await this.supabase
              .from('profiles')
              .upsert({
                id: userId,
                role: 'seller',
                updated_at: new Date().toISOString()
              });
              
            if (updateProfileError) {
              console.error("SellerRecoveryService: Error updating profile:", updateProfileError);
            } else {
              repairActions.push('Created profile with seller role');
              repairPerformed = true;
            }
            
            // Create seller record
            const { error: createSellerError } = await this.supabase
              .from('sellers')
              .insert({
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                verification_status: 'pending'
              });
              
            if (createSellerError) {
              console.error("SellerRecoveryService: Error creating seller record:", createSellerError);
            } else {
              repairActions.push('Created seller record');
              repairPerformed = true;
            }
          }
        } catch (error) {
          console.error("SellerRecoveryService: Error during full registration:", error);
        }
      }
      
      // Step 6: Verify repairs were successful
      if (repairPerformed) {
        console.log("SellerRecoveryService: Verifying repairs were successful");
        await sellerVerificationService.verifySellerRegistration(userId);
      }
      
      // Return diagnosis and repair results
      return {
        success: true,
        repaired: repairPerformed,
        diagnosisDetails: {
          metadataHasRole,
          profileHasRole,
          sellerRecordExists,
          repairActions
        }
      };
    } catch (error) {
      console.error("SellerRecoveryService: Error during repair:", error);
      return {
        success: false,
        repaired: false,
        diagnosisDetails: {
          metadataHasRole: false,
          profileHasRole: false,
          sellerRecordExists: false,
          repairActions: ['Error during repair process']
        }
      };
    }
  }
  
  /**
   * Diagnoses seller registration status without making any repairs
   */
  async diagnoseSellerRegistration(userId: string): Promise<{
    metadataHasRole: boolean;
    profileHasRole: boolean;
    sellerRecordExists: boolean;
    isComplete: boolean;
  }> {
    try {
      console.log("SellerRecoveryService: Starting registration diagnosis for user:", userId);
      
      // Check metadata
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      if (userError) {
        console.error("SellerRecoveryService: Error fetching user data:", userError);
        throw userError;
      }
      
      const metadataHasRole = userData?.user?.user_metadata?.role === 'seller';
      
      // Check profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error("SellerRecoveryService: Error checking profile:", profileError);
      }
      
      const profileHasRole = profile?.role === 'seller';
      
      // Check seller record
      const { data: seller, error: sellerError } = await this.supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (sellerError) {
        console.error("SellerRecoveryService: Error checking seller record:", sellerError);
      }
      
      const sellerRecordExists = !!seller;
      
      // Registration is complete if all three components exist
      const isComplete = metadataHasRole && profileHasRole && sellerRecordExists;
      
      return {
        metadataHasRole,
        profileHasRole,
        sellerRecordExists,
        isComplete
      };
    } catch (error) {
      console.error("SellerRecoveryService: Error during diagnosis:", error);
      return {
        metadataHasRole: false,
        profileHasRole: false,
        sellerRecordExists: false,
        isComplete: false
      };
    }
  }
}

// Export a singleton instance
export const sellerRecoveryService = new SellerRecoveryService();
