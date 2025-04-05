
/**
 * Changes made:
 * - 2024-08-16: Created structured logging utility for application errors
 * - 2025-04-05: Fixed TypeScript type issues with ErrorCode
 */

import { AppError } from '@/errors/classes';
import { ErrorCategory, ErrorCode } from '@/errors/types';

// Interface for log entry structure
export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  category: ErrorCategory; 
  code: string;
  message: string;
  description?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  userContext?: {
    userId?: string;
    userAgent?: string;
    path?: string;
  };
}

// Options for logging
export interface LoggingOptions {
  includeStack?: boolean;
  includeUserContext?: boolean;
  addToConsole?: boolean;
  addToStorage?: boolean;
}

const DEFAULT_OPTIONS: LoggingOptions = {
  includeStack: true,
  includeUserContext: true,
  addToConsole: true,
  addToStorage: true
};

/**
 * Logs an error with structured format
 */
export function logError(
  error: unknown, 
  contextMessage?: string,
  options: LoggingOptions = DEFAULT_OPTIONS
): ErrorLogEntry {
  const { 
    includeStack, 
    includeUserContext, 
    addToConsole, 
    addToStorage 
  } = { ...DEFAULT_OPTIONS, ...options };
  
  // Normalize error to AppError
  const appError = error instanceof AppError 
    ? error 
    : new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error 
          ? error.message 
          : String(error || 'Unknown error'),
        category: ErrorCategory.UNKNOWN,
      });
  
  // Extract user context information if enabled
  const userContext = includeUserContext 
    ? {
        userId: localStorage.getItem('userId') || undefined,
        userAgent: navigator.userAgent,
        path: window.location.pathname
      }
    : undefined;
  
  // Create structured log entry
  const logEntry: ErrorLogEntry = {
    id: appError.id,
    timestamp: new Date().toISOString(),
    level: 'error',
    category: appError.category,
    code: appError.code,
    message: contextMessage 
      ? `${contextMessage}: ${appError.message}`
      : appError.message,
    description: appError.description,
    stackTrace: includeStack ? appError.stack : undefined,
    metadata: appError.metadata,
    userContext
  };
  
  // Add to console if enabled
  if (addToConsole) {
    console.error(
      `[ERROR][${logEntry.category}][${logEntry.code}] ${logEntry.message}`,
      logEntry
    );
  }
  
  // Add to local storage if enabled (for debugging purposes)
  if (addToStorage) {
    try {
      const storedLogs = JSON.parse(
        localStorage.getItem('errorLogs') || '[]'
      ) as ErrorLogEntry[];
      
      // Keep only the last 50 logs to prevent storage overflow
      const updatedLogs = [logEntry, ...storedLogs].slice(0, 50);
      localStorage.setItem('errorLogs', JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.warn('Failed to store error log in localStorage:', storageError);
    }
  }
  
  return logEntry;
}

/**
 * Retrieves error logs from storage
 */
export function getErrorLogs(): ErrorLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem('errorLogs') || '[]') as ErrorLogEntry[];
  } catch (e) {
    console.warn('Failed to retrieve error logs from localStorage');
    return [];
  }
}

/**
 * Clears error logs from storage
 */
export function clearErrorLogs(): void {
  localStorage.removeItem('errorLogs');
}
