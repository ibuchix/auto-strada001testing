/**
 * Shared type definitions for Auto-Strada edge functions
 */

// Valuation data types
export interface ValuationData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  transmission?: string;
  mileage?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  basePrice?: number;
  apiSource?: string;
  error?: string;
  noData?: boolean;
  isExisting?: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Request parameter types
export interface VinValidationRequest {
  vin: string;
  mileage?: number;
  gearbox?: 'manual' | 'automatic';
  allowExisting?: boolean;
}

// Cache types
export interface CacheEntry<T> {
  created_at: string;
  data: T;
  expires_at?: string;
}

// Utility types
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  [key: string]: any;
}
