
/**
 * Types for auth-related hooks and functions
 */

export interface AuthRegisterResult {
  success: boolean;
  error?: string;
}

export interface AuthActionOptions {
  showToast?: boolean;
}
