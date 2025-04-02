
/**
 * Created 2028-05-15: Error types for application-wide error handling
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  SUBMISSION = 'submission',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  GENERAL = 'general',
  UNKNOWN = 'unknown'
}

export enum RecoveryType {
  FORM_RETRY = 'form_retry',
  FIELD_CORRECTION = 'field_correction',
  NAVIGATE = 'navigate',
  SIGN_IN = 'sign_in',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support',
  CUSTOM = 'custom'
}

export interface RecoveryAction {
  type: RecoveryType;
  label: string;
  action: () => void;
  fieldId?: string; // For field-specific recovery
  route?: string; // For navigation-based recovery
}
