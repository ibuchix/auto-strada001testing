
/**
 * Supabase transaction service types
 * Created: 2025-07-22
 */

export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query'
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
}
