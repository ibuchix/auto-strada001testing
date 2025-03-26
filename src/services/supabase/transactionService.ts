
/**
 * Transaction status types and interfaces for the application
 */
import { TransactionStatus } from "@/types/forms";

export type { TransactionStatus };

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
