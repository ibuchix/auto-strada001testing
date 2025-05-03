
/**
 * Supabase transaction service types
 * Created: 2025-07-22
 * Updated: 2025-05-11 - Added missing TransactionType enum values
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
  type: TransactionType;
  status: TransactionStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: any;
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
  LOGOUT = 'logout'
}
