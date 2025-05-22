
/**
 * Supabase transaction service types
 * Created: 2025-07-22
 * Updated: 2025-05-11 - Added missing TransactionType enum values
 * Updated: 2025-05-11 - Fixed AuditLogAction enum values to match database types
 * Updated: 2025-05-26 - Aligned AuditLogAction exactly with database schema
 * Updated: 2025-05-26 - Ensured AuditLogAction is a string union type matching database
 * Updated: 2025-05-27 - Updated AuditLogAction to include all valid database action types
 * Updated: 2025-05-29 - Fixed AuditLogAction to exactly match database audit_log_type enum
 * Updated: 2025-05-30 - Removed "bid_process" which is not in the database schema
 */

export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication'
}

export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface TransactionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retryCount?: number;
  showToast?: boolean;
  toastDuration?: number;
  logToDb?: boolean;
  retryDelay?: number;
  description?: string;
  metadata?: Record<string, any>;
  onComplete?: () => void;
}

export interface TransactionDetails {
  id?: string;
  type: TransactionType;
  status: TransactionStatus;
  operation?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startTime: number; // Using number for timestamp
  endTime?: number; // Using number for timestamp
  duration?: number;
  error?: any;
  errorDetails?: string;
  data?: any;
  metadata?: Record<string, any>;
}

// Define as string literal union type exactly matching the database schema for audit_log_type
export type AuditLogAction = 
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'verify'
  | 'reject'
  | 'approve'
  | 'suspend'
  | 'reinstate'
  | 'process_auctions'
  | 'auction_closed'
  | 'auto_proxy_bid'
  | 'start_auction'
  | 'payment_process'
  | 'system_repair'
  | 'system_alert'
  | 'system_health_check'
  | 'auction_recovery';
