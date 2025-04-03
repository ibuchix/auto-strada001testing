
/**
 * Simplified transaction system types
 * - Removed diagnostic-specific fields
 * - Streamlined for core functionality
 * - 2025-04-03: Fixed TransactionStatus type to be properly typed as an enum
 */

// Define transaction types to categorize different operations
export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication',
  OTHER = 'other'
}

// Status of the transaction
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Interface for transaction details
export interface TransactionDetails {
  id: string;
  operation: string;
  type: TransactionType;
  entityId?: string; 
  entityType?: string; // Added entityType property
  status: TransactionStatus;
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
  errorDetails?: string;
  userId?: string;
}

// Configuration options for transaction
export interface TransactionOptions {
  showToast?: boolean;
  toastDuration?: number;
  logToDb?: boolean;
  retryCount?: number;
  retryDelay?: number;
  description?: string;
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  onComplete?: (details: TransactionDetails) => void;
  type?: TransactionType; // Added type property to options
}

// Type for audit log action - simplified
export type AuditLogAction = 
  | "create" 
  | "update" 
  | "delete" 
  | "login" 
  | "logout" 
  | "auction_closed" 
  | "system_alert";
