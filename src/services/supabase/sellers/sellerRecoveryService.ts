
/**
 * Updated: 2025-08-27
 * Fixed RPC method call in SellerRecoveryService
 */

import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export interface SellerDiagnosisResult {
  success: boolean;
  repaired: boolean;
  message: string;
  userId: string;
  diagnosisDetails: {
    hasProfileRecord: boolean;
    hasSellerRecord: boolean;
    hasSellerRole: boolean;
    isVerified: boolean;
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
          isVerified
        }
      };
    } catch (error) {
      console.error("Error diagnosing seller status:", error);
      throw error;
    }
  }

  async repairSellerRegistration(session: Session): Promise<SellerDiagnosisResult> {
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = session.user.id;
      
      // Call a custom RPC function to repair the registration
      // This function will be implemented on the server side
      const { data, error } = await supabase
        .rpc('repair_seller_registration', {
          p_user_id: userId
        });
      
      if (error) {
        console.error("Error repairing seller registration:", error);
        throw error;
      }
      
      // Run diagnosis after repair to get updated status
      const diagnosisResult = await this.diagnoseSellerStatus(session);
      
      // Mark as repaired
      return {
        ...diagnosisResult,
        repaired: true,
        message: "Seller registration has been repaired"
      };
    } catch (error) {
      console.error("Error repairing seller registration:", error);
      throw error;
    }
  }
}

// Create an instance for use throughout the application
export const sellerRecoveryService = new SellerRecoveryService();
