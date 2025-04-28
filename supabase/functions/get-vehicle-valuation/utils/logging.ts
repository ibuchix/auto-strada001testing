
/**
 * Enhanced logging utility for edge functions with detailed request diagnostics
 * Updated: 2025-04-30 - Added request diagnostics and improved error logging
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
    console.error(JSON.stringify(logData));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logData));
  } else {
    console.log(JSON.stringify(logData));
  }
}

/**
 * Log request diagnostic information in great detail
 */
export function logRequestDiagnostics(
  requestId: string,
  request: Request,
  bodyText?: string
): void {
  // Log request headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  logOperation('request_diagnostics', {
    requestId,
    method: request.method,
    url: request.url,
    headers,
    bodyTextAvailable: !!bodyText,
    bodyTextLength: bodyText ? bodyText.length : 0,
    bodyTextSample: bodyText ? bodyText.substring(0, 100) + (bodyText.length > 100 ? '...' : '') : undefined
  });
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
 * Log an API response with detailed analysis
 */
export function logApiResponse(
  endpoint: string,
  status: number,
  data: any,
  requestId: string,
  duration: number
): void {
  let responseSize;
  let responsePreview;
  let responseType;
  
  if (typeof data === 'string') {
    responseSize = data.length;
    responsePreview = data.length > 200 ? data.substring(0, 200) + '...' : data;
    responseType = 'string';
  } else {
    const stringified = JSON.stringify(data);
    responseSize = stringified.length;
    responsePreview = stringified.length > 200 ? stringified.substring(0, 200) + '...' : stringified;
    responseType = typeof data;
  }

  logOperation('api_response', {
    endpoint,
    status,
    responseType,
    responseSize,
    responsePreview,
    requestId,
    durationMs: duration,
    hasError: status >= 400
  });
}

/**
 * Log an error with enhanced details
 */
export function logError(
  message: string,
  error: Error | unknown,
  context: Record<string, any> = {}
): void {
  // Extract as much information as possible from the error
  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined,
    code: (error as any)?.code,
    cause: (error as any)?.cause,
  };
  
  logOperation('error', {
    message,
    errorDetails,
    ...context
  }, 'error');
}

/**
 * Log validation errors with detailed context
 */
export function logValidationError(
  requestId: string, 
  error: string,
  data: any
): void {
  // Clean sensitive data if needed before logging
  const sanitizedData = data ? { ...data } : {};
  
  // Log detailed validation context
  logOperation('validation_error', {
    requestId,
    error,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : [],
    vinProvided: !!data?.vin,
    mileageProvided: data?.mileage !== undefined,
    gearboxProvided: !!data?.gearbox
  }, 'error');
}
