
/**
 * API timeout constants
 * 
 * Changes made:
 * - 2025-11-05: Created as part of apiClientService refactoring
 */

// Default timeout in milliseconds
export const DEFAULT_TIMEOUT = 15000;

// Timeout durations for different types of requests
export const TimeoutDurations = {
  SHORT: 5000,    // 5 seconds
  DEFAULT: 15000, // 15 seconds
  LONG: 30000,    // 30 seconds
  EXTENDED: 60000 // 60 seconds
};
