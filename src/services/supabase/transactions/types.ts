
/**
 * Transaction Service Types
 * Created: 2025-06-22 - Added missing transaction-related types
 * Updated: 2025-06-23 - Fixed export issues with TransactionStatus
 */

// Transaction Status enum - exported properly now
export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Transaction types enum
export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  OTHER = 'other'
}

// Transaction options interface
export interface TransactionOptions {
  userId?: string;
  metadata?: Record<string, any>;
  additionalInfo?: string;
  notify?: boolean;
  showToast?: boolean;
  toastDuration?: number;
  logToDb?: boolean;
  retryCount?: number;
  retryDelay?: number;
  description?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: (details: TransactionDetails) => void;
}

// Transaction details interface
export interface TransactionDetails {
  id?: string;
  operation?: string;
  type: TransactionType;
  status: TransactionStatus;
  message?: string;
  userId?: string;
  metadata?: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
  timestamp?: string;
  duration?: number;
  errorDetails?: string;
}

// Audit log action enum
export enum AuditLogAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  PAYMENT = 'payment',
  CUSTOM = 'custom'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  INTERNAL = 'internal',
  GENERAL = 'general',
  UNKNOWN = 'unknown'
}
