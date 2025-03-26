
/**
 * Updated: 2024-09-08
 * Aligned TransactionStatus and TransactionType with the types in transactions/types.ts
 * Exported TransactionOptions interface
 */

import { TransactionStatus, TransactionType, TransactionOptions, TransactionMetadata } from '@/services/supabase/transactions/types';

export type { TransactionStatus, TransactionType, TransactionOptions } from '@/services/supabase/transactions/types';

export interface Transaction {
  id: string;
  name: string;
  status: TransactionStatus;
  type: TransactionType;
  error?: string;
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

export interface TransactionDetails {
  id: string;
  status: TransactionStatus;
  type: TransactionType;
  name: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  errorDetails?: string;
  metadata?: Record<string, any>;
}

// Simple mock implementation of transaction service
class TransactionService {
  async executeTransaction<T>(
    operation: string,
    type: TransactionType,
    callback: () => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T | null> {
    try {
      const result = await callback();
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (error) {
      if (options.onError) {
        options.onError(error);
      }
      return null;
    }
  }
}

export const transactionService = new TransactionService();
