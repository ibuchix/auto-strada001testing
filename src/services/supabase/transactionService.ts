
/**
 * Changes made:
 * - 2028-06-20: Fixed TransactionStatus enum references
 * - Simplified transaction service to remove diagnostic dependencies
 * - Added TransactionType enum to categorize transactions
 * - Added missing exports needed by components
 */
import { TransactionStatus } from "@/types/forms";

export type { TransactionStatus };

// Add TransactionType enum
export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication'
}

export interface TransactionOptions {
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  throwOnError?: boolean;
  retryCount?: number;
  logToDb?: boolean;
}

export const TRANSACTION_STATUS = {
  IDLE: 'idle' as TransactionStatus,
  PENDING: 'pending' as TransactionStatus,
  SUCCESS: 'success' as TransactionStatus,
  ERROR: 'error' as TransactionStatus
};
