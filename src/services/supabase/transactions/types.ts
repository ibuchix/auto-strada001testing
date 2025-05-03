
/**
 * Supabase transaction service types
 * Created: 2025-07-22
 * Updated: 2025-05-11 - Added missing TransactionType enum values
 * Updated: 2025-05-11 - Fixed AuditLogAction enum values to match database types
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

export enum AuditLogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  LOGIN = 'login',
  LOGOUT = 'logout',
  AUCTION_CLOSED = 'auction_closed'
}
