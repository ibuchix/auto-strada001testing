
/**
 * Updated: 2025-08-28
 * Fixed RPC method call and extended SellerDiagnosisResult interface
 */

import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export interface SellerDiagnosisResult {
  success: boolean;
  repaired: boolean;
  message: string;
  error?: string; // Added error property
  userId: string;
  diagnosisDetails: {
    hasProfileRecord: boolean;
    hasSellerRecord: boolean;
    hasSellerRole: boolean;
    isVerified: boolean;
    hasMetadata?: boolean; // Added metadata-related properties
    metadataRole?: string;
    profileRole?: string;
  };
}

export class SellerRecoveryService {
  async diagnoseSellerStatus(session: Session): Promise<SellerDiagnosisResult> {
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = session.user.id;
      
      // Check user metadata first (fastest)
      const hasSellerRole = session.user.user_metadata?.role === 'seller';
      const metadataRole = session.user.user_metadata?.role;
      const hasMetadata = !!session.user.user_metadata?.role;
      
      // Check for profile record
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error checking profile:", profileError);
      }
      
      const hasProfileRecord = !!profileData;
      const profileRole = profileData?.role;
      const hasProfileSellerRole = profileData?.role === 'seller';
      
      // Check for seller record
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id, is_verified')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (sellerError) {
        console.error("Error checking seller record:", sellerError);
      }
      
      const hasSellerRecord = !!sellerData;
      const isVerified = sellerData?.is_verified === true;
      
      // Determine success state
      const success = hasProfileRecord && hasSellerRecord && (hasSellerRole || hasProfileSellerRole);
      
      return {
        success,
        repaired: false,
        message: success 
          ? "Seller registration is complete" 
          : "Seller registration needs repair",
        userId,
        diagnosisDetails: {
          hasProfileRecord,
          hasSellerRecord,
          hasSellerRole: hasSellerRole || hasProfileSellerRole,
          isVerified,
          hasMetadata,
          metadataRole,
          profileRole
        }
      };
    } catch (error: any) {
      console.error("Error diagnosing seller status:", error);
      return {
        success: false,
        repaired: false,
        message: "Error diagnosing seller status",
        error: error.message || "Unknown error occurred",
        userId: session?.user?.id || '',
        diagnosisDetails: {
          hasProfileRecord: false,
          hasSellerRecord: false,
          hasSellerRole: false,
          isVerified: false
        }
      };
    }
  }

  // Renaming to match what the hook expects
  async repairSellerStatus(session: Session): Promise<SellerDiagnosisResult> {
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = session.user.id;
      
      // Instead of calling RPC, use our SQL capabilities directly
      // First, ensure profile exists
      const { data: profileExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (!profileExists) {
        // Create profile if it doesn't exist
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: 'seller'
          });
      } else {
        // Update profile role if it exists
        await supabase
          .from('profiles')
          .update({ role: 'seller' })
          .eq('id', userId);
      }
      
      // Then, ensure seller record exists
      const { data: sellerExists } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!sellerExists) {
        // Create seller record if it doesn't exist
        await supabase
          .from('sellers')
          .insert({
            user_id: userId
          });
      }
      
      // Run diagnosis after repair to get updated status
      const diagnosisResult = await this.diagnoseSellerStatus(session);
      
      // Mark as repaired
      return {
        ...diagnosisResult,
        repaired: true,
        message: "Seller registration has been repaired"
      };
    } catch (error: any) {
      console.error("Error repairing seller registration:", error);
      return {
        success: false,
        repaired: false,
        message: "Error repairing seller registration",
        error: error.message || "Unknown error occurred",
        userId: session?.user?.id || '',
        diagnosisDetails: {
          hasProfileRecord: false,
          hasSellerRecord: false,
          hasSellerRole: false,
          isVerified: false
        }
      };
    }
  }
}

// Create an instance for use throughout the application
export const sellerRecoveryService = new SellerRecoveryService();
