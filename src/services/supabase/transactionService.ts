
/**
 * Simplified transaction service
 * - Removed diagnostic dependencies
 * - Streamlined transaction logging
 */

import { TransactionStatus } from './transactions/types';

// Re-export transaction status enum for backward compatibility
export enum TRANSACTION_STATUS {
  IDLE = "idle",
  PENDING = "pending",
  SUCCESS = "success",
  ERROR = "error"
}

// Re-export transaction type enum
export enum TransactionType {
  AUCTION = "auction",
  LISTING = "listing",
  USER = "user",
  SYSTEM = "system",
  BID = "bid",
  PAYMENT = "payment"
}

// Re-export transaction status type
export type { TransactionStatus };

// Configuration options for transactions
export interface TransactionOptions {
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  retryCount?: number;
}

// Safely converts transaction data to JSON-compatible format
export const safeJsonify = (data: any): any => {
  try {
    // Create a new object with only serializable properties
    const safeData: Record<string, any> = {};
    
    // Process only the first level of properties to avoid circular references
    Object.entries(data || {}).forEach(([key, value]) => {
      // Skip functions
      if (typeof value === 'function') return;
      
      // For objects, convert to string representation to avoid deep traversal
      if (typeof value === 'object' && value !== null) {
        try {
          safeData[key] = JSON.stringify(value);
        } catch (e) {
          safeData[key] = `[Object: ${typeof value}]`;
        }
        return;
      }
      
      // Handle primitive values
      safeData[key] = value;
    });
    
    return safeData;
  } catch (e) {
    console.error('Error converting transaction data to JSON:', e);
    return { error: 'Data conversion error' };
  }
};
