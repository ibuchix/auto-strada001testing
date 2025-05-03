
/**
 * Transaction Service Types
 * Created: 2025-06-22 - Added missing transaction-related types
 */

import { TransactionStatus } from "@/types/forms";

// Transaction types enum
export enum TransactionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  AUCTION = 'auction',
  AUTHENTICATION = 'authentication',
  OTHER = 'other'
}

// Transaction options interface
export interface TransactionOptions {
  userId?: string;
  metadata?: Record<string, any>;
  additionalInfo?: string;
  notify?: boolean;
}

// Transaction details interface
export interface TransactionDetails {
  id?: string;
  type: TransactionType;
  status: TransactionStatus;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  duration?: number;
}

// Audit log action enum
export enum AuditLogAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  PAYMENT = 'payment',
  CUSTOM = 'custom'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  INTERNAL = 'internal',
  GENERAL = 'general'
}
