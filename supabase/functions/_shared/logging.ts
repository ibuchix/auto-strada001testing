
/**
 * Log an operation with structured data
 * @param operation Name of the operation being performed
 * @param data Additional data to include in the log
 * @param level Log level (default 'info')
 */
export function logOperation(
  operation: string, 
  data: Record<string, any>, 
  level: 'info' | 'warn' | 'error' | 'debug' = 'info'
): void {
  const logData = {
    operation,
    ...data,
    timestamp: new Date().toISOString()
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(JSON.stringify(logData));
      break;
    case 'debug':
      console.debug(JSON.stringify(logData));
      break;
    case 'info':
    default:
      console.log(JSON.stringify(logData));
  }
}

/**
 * Log an error with structured data
 * @param context Context where the error occurred
 * @param error The error object
 */
export function logError(context: string, error: any): void {
  logOperation(
    'error',
    {
      context,
      message: error.message,
      stack: error.stack,
      data: error.data
    },
    'error'
  );
}
