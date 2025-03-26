
/**
 * Changes made:
 * - 2024-10-28: Created separate types file for transaction system
 * - 2024-07-24: Added WARNING status and additional transaction types
 */

// Define transaction types to categorize different operations
export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication',
  OTHER = 'other'
}

// Status of the transaction
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning'
}

// Interface for transaction details
export interface TransactionDetails {
  id: string;
  operation: string;
  type: TransactionType;
  entityId?: string; 
  entityType?: string;
  status: TransactionStatus;
  startTime: string;
  endTime?: string;
  metadata?: Record<string, any>;
  errorDetails?: string;
  userId?: string;
}

// Configuration options for transaction
export interface TransactionOptions {
  showToast?: boolean;
  toastDuration?: number;
  logToDb?: boolean;
  retryCount?: number;
  retryDelay?: number;
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  onComplete?: (details: TransactionDetails) => void;
}

// Type for audit log action
export type AuditLogAction = 
  | "login" 
  | "logout" 
  | "create" 
  | "update" 
  | "delete" 
  | "suspend" 
  | "reinstate" 
  | "verify" 
  | "reject" 
  | "approve" 
  | "process_auctions" 
  | "auction_closed" 
  | "auto_proxy_bid" 
  | "start_auction" 
  | "auction_close_failed" 
  | "auction_close_system_error" 
  | "system_reset_failed" 
  | "recovery_failed" 
  | "manual_retry" 
  | "auction_recovery" 
  | "system_health_check" 
  | "system_alert";
