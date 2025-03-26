
/**
 * Updated: 2024-09-08
 * Fixed SellerRecoveryService implementation
 */

import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface SellerDiagnosisDetails {
  hasProfileRecord: boolean;
  hasSellerRecord: boolean;
  hasSellerRole: boolean;
  isVerified: boolean;
  hasMetadata: boolean;
  metadataRole?: string;
  profileRole?: string;
}

export interface SellerDiagnosisResult {
  success: boolean;
  message: string;
  error?: string;
  diagnosisDetails: SellerDiagnosisDetails;
  userId?: string;
  repaired?: boolean;
}

export class SellerRecoveryService {
  async diagnoseSellerStatus(session: Session): Promise<SellerDiagnosisResult> {
    const userId = session.user.id;
    
    try {
      // Check profile record
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Check seller record
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Check user metadata
      const metadata = session.user.user_metadata || {};
      const metadataRole = metadata.role;
      const profileRole = profileData?.role;
      
      const diagnosisDetails: SellerDiagnosisDetails = {
        hasProfileRecord: !!profileData,
        hasSellerRecord: !!sellerData,
        hasSellerRole: profileData?.role === 'seller',
        isVerified: sellerData?.verified === true,
        hasMetadata: !!metadataRole,
        metadataRole,
        profileRole
      };
      
      const success = 
        diagnosisDetails.hasProfileRecord && 
        diagnosisDetails.hasSellerRecord && 
        diagnosisDetails.hasSellerRole && 
        diagnosisDetails.hasMetadata && 
        metadataRole === 'seller';
      
      return {
        success,
        message: success ? 'Seller status is valid' : 'Seller status issues detected',
        diagnosisDetails,
        userId
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to diagnose seller status',
        error: error.message,
        diagnosisDetails: {
          hasProfileRecord: false,
          hasSellerRecord: false,
          hasSellerRole: false,
          isVerified: false,
          hasMetadata: false
        },
        userId
      };
    }
  }
  
  async repairSellerStatus(session: Session): Promise<SellerDiagnosisResult> {
    const userId = session.user.id;
    const diagnosis = await this.diagnoseSellerStatus(session);
    
    if (diagnosis.success) {
      return {
        ...diagnosis,
        message: 'Seller status is already valid, no repair needed',
        repaired: false
      };
    }
    
    try {
      const { diagnosisDetails } = diagnosis;
      
      // Create or update profile record if needed
      if (!diagnosisDetails.hasProfileRecord || diagnosisDetails.profileRole !== 'seller') {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            role: 'seller',
            updated_at: new Date().toISOString()
          });
      }
      
      // Create seller record if needed
      if (!diagnosisDetails.hasSellerRecord) {
        await supabase
          .from('sellers')
          .upsert({
            user_id: userId,
            verified: true,
            created_at: new Date().toISOString()
          });
      }
      
      // Update user metadata via RPC
      if (!diagnosisDetails.hasMetadata || diagnosisDetails.metadataRole !== 'seller') {
        await supabase.rpc('update_user_role', {
          user_id: userId,
          new_role: 'seller'
        });
      }
      
      // Re-run diagnosis to confirm repair
      const finalDiagnosis = await this.diagnoseSellerStatus(session);
      
      return {
        ...finalDiagnosis,
        message: finalDiagnosis.success 
          ? 'Seller registration successfully repaired' 
          : 'Repair attempt completed but some issues remain',
        repaired: true
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to repair seller status',
        error: error.message,
        diagnosisDetails: diagnosis.diagnosisDetails,
        userId,
        repaired: false
      };
    }
  }
}

export const sellerRecoveryService = new SellerRecoveryService();
