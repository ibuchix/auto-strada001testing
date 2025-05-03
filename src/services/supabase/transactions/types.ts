
/**
 * Transaction service type definitions
 * Updated: 2025-07-01 - Added missing types and export declarations
 */

// TransactionStatus enum - correctly exported
export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

// TransactionType enum
export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  PAYMENT = 'payment',
  AUCTION = 'auction',
  AUTHENTICATION = 'authentication',
  OTHER = 'other'
}

export interface TransactionOptions {
  entityId?: string;
  entityType?: string;
  userId?: string;
  transactionType?: TransactionType;
  retryOnError?: boolean;
  metadata?: Record<string, any>;
}

export interface TransactionDetails {
  transactionId: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  startTime: string;
  endTime?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Audit log action types
export enum AuditLogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PAYMENT = 'payment',
  VIEW = 'view',
  ADMIN = 'admin'
}
