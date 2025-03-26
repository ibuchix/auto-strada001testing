
/**
 * Changes made:
 * - 2023-07-15: Enhanced transaction service with more detailed transaction types and status
 * - 2024-10-31: Updated TransactionType enum to replace GENERAL with OTHER
 */

export enum TransactionStatus {
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum TransactionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  AUCTION = 'auction',
  CUSTOM = 'custom',
  OTHER = 'other'  // Added OTHER instead of GENERAL
}

export interface TransactionOptions {
  description?: string;
  showToast?: boolean;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  retryCount?: number;
  logToDb?: boolean;
}

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
  errorDetails?: string;  // Changed from error to errorDetails for consistency
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
