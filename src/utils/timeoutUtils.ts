
/**
 * Timeout utilities for API calls and operations
 * Created: 2024-04-03
 * Updated: 2024-04-04 - Added STANDARD duration
 */

export const TimeoutDurations = {
  SHORT: 5000,   // 5 seconds
  STANDARD: 5000, // 5 seconds (same as SHORT for now)
  MEDIUM: 10000, // 10 seconds
  LONG: 20000,   // 20 seconds
  EXTENDED: 30000 // 30 seconds
};

/**
 * Execute a promise with timeout
 * @param promise The promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Error message when timeout occurs
 * @returns Promise result or throws timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = TimeoutDurations.LONG,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  const startTime = performance.now();
  
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        const duration = performance.now() - startTime;
        console.warn(`Operation timed out after ${duration.toFixed(2)}ms`, {
          timeoutMs,
          timestamp: new Date().toISOString()
        });
        reject(new Error(errorMessage));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Create a cancelable timeout
 * @param callback Function to execute after timeout
 * @param timeoutMs Timeout in milliseconds
 */
export function createCancelableTimeout(
  callback: () => void,
  timeoutMs: number = TimeoutDurations.MEDIUM
): { clear: () => void } {
  const startTime = performance.now();
  const timeoutId = setTimeout(() => {
    const duration = performance.now() - startTime;
    console.log(`Timeout executed after ${duration.toFixed(2)}ms`, {
      timeoutMs,
      timestamp: new Date().toISOString()
    });
    callback();
  }, timeoutMs);
  
  return {
    clear: () => {
      clearTimeout(timeoutId);
      console.log(`Timeout cleared after ${(performance.now() - startTime).toFixed(2)}ms`, {
        timeoutMs,
        timestamp: new Date().toISOString()
      });
    }
  };
}
