
/**
 * Centralized logging utility for edge functions
 * Created: 2025-04-28
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Log an operation with structured data
 */
export function logOperation(
  operation: string,
  data: Record<string, any>,
  level: LogLevel = 'info'
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...data
  };
  
  // Using console.log for all levels to ensure data appears in Supabase logs
  if (level === 'error') {
    console.error(logData);
  } else if (level === 'warn') {
    console.warn(logData);
  } else {
    console.log(logData);
  }
}

/**
 * Log an API request
 */
export function logApiRequest(
  endpoint: string,
  params: Record<string, any>,
  requestId: string
): void {
  logOperation('api_request', {
    endpoint,
    params,
    requestId
  });
}

/**
 * Log an API response
 */
export function logApiResponse(
  endpoint: string,
  status: number,
  data: any,
  requestId: string,
  duration: number
): void {
  logOperation('api_response', {
    endpoint,
    status,
    responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
    requestId,
    durationMs: duration
  });
}

/**
 * Log an error
 */
export function logError(
  message: string,
  error: Error | unknown,
  context: Record<string, any> = {}
): void {
  logOperation('error', {
    message,
    errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    ...context
  }, 'error');
}
