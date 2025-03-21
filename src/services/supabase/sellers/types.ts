
/**
 * Changes made:
 * - 2024-12-31: Extracted types from sellerProfileService.ts for better organization
 */

import type { UserProfile } from "../profiles/profileService";

export interface SellerProfile extends UserProfile {
  company_name?: string;
  tax_id?: string;
  verification_status?: string;
  address?: string;
  is_verified?: boolean;
  user_id: string;
}

export interface SellerRegistrationResult {
  success: boolean;
  error?: string;
}
