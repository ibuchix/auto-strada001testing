
/**
 * Logging utilities for setup-cars-rls
 * Created: 2025-04-19
 */

export function logOperation(operation: string, details: Record<string, any> = {}): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation,
    ...details
  }));
}

export function logError(context: string, error: Error, additionalDetails: Record<string, any> = {}): void {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    ...additionalDetails
  }));
}
