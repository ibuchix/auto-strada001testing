
/**
 * Updated: 2024-09-08
 * Fixed TransactionType and TransactionStatus enums and exported all necessary types
 */

export enum TransactionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  AUCTION = 'AUCTION',
  CUSTOM = 'CUSTOM',
  OTHER = 'OTHER'
}

export enum TransactionStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ROLLBACK = 'ROLLBACK',
  WARNING = 'WARNING',
  INACTIVE = 'INACTIVE'
}

export interface TransactionDetailsBase {
  id: string;
  type: TransactionType;
  name: string;
  status: TransactionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: any;
  operation?: string;
  entityId?: string;
  entityType?: string;
  errorDetails?: any;
  userId?: string;
}

export interface TransactionDetails extends TransactionDetailsBase {
  steps: TransactionStep[];
  metadata?: Record<string, any>;
}

export interface TransactionStep {
  id: string;
  name: string;
  status: TransactionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: any;
  metadata?: Record<string, any>;
}

export interface TransactionOptions {
  timeout?: number;
  retries?: number;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  metadata?: Record<string, any>;
  description?: string;
  showToast?: boolean;
  entityId?: string;
  entityType?: string;
  retryCount?: number;
  logToDb?: boolean;
}

export type TransactionMetadata = Record<string, any>;
