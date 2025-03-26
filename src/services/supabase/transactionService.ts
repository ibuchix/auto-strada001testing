
/**
 * Changes made:
 * - 2028-07-14: Created TransactionService with types and enums
 */

export enum TransactionStatus {
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface TransactionOptions {
  description?: string;
  showToast?: boolean;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export interface Transaction {
  id: string;
  name: string;
  status: TransactionStatus;
  error?: string;
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}
