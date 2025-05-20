
/**
 * Common type definitions for authentication hooks
 */

export interface AuthRegisterResult {
  success: boolean;
  error?: string;
}

export interface AuthActionOptions {
  showToast?: boolean;
}
