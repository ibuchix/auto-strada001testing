
/**
 * Enhanced logging utility for edge functions with detailed request diagnostics
 * Created: 2025-04-28 - Added comprehensive logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

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
  
  if (level === 'error') {
    console.error(JSON.stringify(logData));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logData));
  } else {
    console.log(JSON.stringify(logData));
  }
}

export function logRequestDiagnostics(
  requestId: string,
  request: Request,
  bodyText?: string
): void {
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
    responseType: typeof data,
    responseSize: JSON.stringify(data).length,
    requestId,
    durationMs: duration,
    hasError: status >= 400
  });
}
