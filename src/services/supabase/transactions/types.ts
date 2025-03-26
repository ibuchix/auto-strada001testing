
/**
 * Created: 2025-08-25
 * Types for transaction service
 */

export enum TransactionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ'
}

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error' | 'rollback';

export interface TransactionDetailsBase {
  id: string;
  type: TransactionType;
  name: string;
  status: TransactionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: any;
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
}
