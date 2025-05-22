
/**
 * Supabase transaction service types
 * Created: 2025-07-22
 * Updated: 2025-05-11 - Added missing TransactionType enum values
 * Updated: 2025-05-11 - Fixed AuditLogAction enum values to match database types
 * Updated: 2025-05-26 - Aligned AuditLogAction enum exactly with database schema
 */

export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  PAYMENT = 'payment',
  AUTHENTICATION = 'authentication'
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
  toastDuration?: number;
  logToDb?: boolean;
  retryDelay?: number;
  description?: string;
  metadata?: Record<string, any>;
  onComplete?: () => void;
}

export interface TransactionDetails {
  id?: string;
  type: TransactionType;
  status: TransactionStatus;
  operation?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startTime: number; // Using number for timestamp
  endTime?: number; // Using number for timestamp
  duration?: number;
  error?: any;
  errorDetails?: string;
  data?: any;
  metadata?: Record<string, any>;
}

export enum AuditLogAction {
  // User actions
  LOGIN = 'login',
  LOGOUT = 'logout',
  
  // CRUD operations
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  
  // Administrative actions
  VERIFY = 'verify',
  REJECT = 'reject',
  APPROVE = 'approve',
  SUSPEND = 'suspend',
  REINSTATE = 'reinstate',
  
  // Auction operations
  PROCESS_AUCTIONS = 'process_auctions',
  AUCTION_CLOSED = 'auction_closed',
  AUTO_PROXY_BID = 'auto_proxy_bid',
  START_AUCTION = 'start_auction',
  BID_PROCESS = 'bid_process',
  
  // File operations
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  
  // System operations
  PAYMENT_PROCESS = 'payment_process',
  SYSTEM_REPAIR = 'system_repair',
  SYSTEM_ALERT = 'system_alert',
  SYSTEM_HEALTH_CHECK = 'system_health_check'
}
