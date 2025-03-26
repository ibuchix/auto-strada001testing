
/**
 * Transaction service type definitions
 */
import { Json } from "@/integrations/supabase/types";

export enum TRANSACTION_STATUS {
  IDLE = "idle",
  PENDING = "pending",
  SUCCESS = "success",
  ERROR = "error"
}

export enum TransactionType {
  AUCTION = "auction",
  LISTING = "listing",
  USER = "user",
  SYSTEM = "system",
  BID = "bid",
  PAYMENT = "payment"
}

export type TransactionStatus = "idle" | "pending" | "success" | "error";

export interface TransactionOptions {
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  retryCount?: number;
}

export interface TransactionLogEntry {
  transaction_id: string;
  transaction_name: string;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  error?: any;
  result?: any;
  created_at?: string;
}

// Safely converts transaction data to JSON-compatible format
export const safeJsonify = (data: any): Json => {
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
    
    return safeData as Json;
  } catch (e) {
    console.error('Error converting transaction data to JSON:', e);
    return { error: 'Data conversion error' } as Json;
  }
};

