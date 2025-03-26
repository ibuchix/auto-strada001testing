
/**
 * Created: 2024-08-19
 * Types for authentication-related hooks
 */

/**
 * Result of an authentication registration operation
 */
export interface AuthRegisterResult {
  success: boolean;
  error?: string;
  userData?: any;
}

/**
 * Options for authentication actions
 */
export interface AuthActionOptions {
  showToast?: boolean;
  redirectUrl?: string;
  [key: string]: any;
}
