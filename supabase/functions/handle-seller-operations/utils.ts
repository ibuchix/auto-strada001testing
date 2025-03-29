
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging for edge function operations
 */
export function logOperation(
  operation: string, 
  details: Record<string, any>,
  level: LogLevel = 'info'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

/**
 * Validation error with code for better error handling
 */
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * API error with code for better error handling
 */
export class ApiError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Helper to safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logOperation('json_parse_error', { error: error.message }, 'warn');
    return defaultValue;
  }
}
