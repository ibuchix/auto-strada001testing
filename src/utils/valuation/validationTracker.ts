
/**
 * Validation Tracking Utilities
 * Created: 2025-04-17
 * 
 * Provides functionality for tracking validation attempts and success rates
 */

interface ValidationAttempt {
  timestamp: number;
  vin: string;
  mileage: number;
  success: boolean;
  error?: string;
  processingTime: number;
}

const STORAGE_KEY = 'valuation_validation_tracker';
const MAX_TRACKED_ATTEMPTS = 10;

/**
 * Records a validation attempt for analytics and troubleshooting
 */
export const trackValidationAttempt = (
  vin: string,
  mileage: number,
  success: boolean,
  processingTime: number,
  error?: string
): void => {
  try {
    const existingData = getTrackedAttempts();
    
    const newAttempt: ValidationAttempt = {
      timestamp: Date.now(),
      vin,
      mileage,
      success,
      processingTime,
      error
    };
    
    // Add new attempt to the beginning of the array
    existingData.unshift(newAttempt);
    
    // Limit the number of tracked attempts
    const limitedData = existingData.slice(0, MAX_TRACKED_ATTEMPTS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedData));
    
    // Log current success rate for monitoring
    const successRate = calculateSuccessRate();
    console.log(`Valuation validation success rate: ${(successRate * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('Failed to track validation attempt:', error);
  }
};

/**
 * Retrieves tracked validation attempts
 */
export const getTrackedAttempts = (): ValidationAttempt[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return [];
    }
    
    return JSON.parse(storedData) as ValidationAttempt[];
  } catch (error) {
    console.error('Failed to retrieve tracked validation attempts:', error);
    return [];
  }
};

/**
 * Calculates the success rate of recent validation attempts
 */
export const calculateSuccessRate = (): number => {
  const attempts = getTrackedAttempts();
  
  if (attempts.length === 0) {
    return 1.0; // Default to 100% if no data
  }
  
  const successCount = attempts.filter(attempt => attempt.success).length;
  return successCount / attempts.length;
};

/**
 * Clears tracked validation attempts
 */
export const clearTrackedAttempts = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tracked validation attempts:', error);
  }
};
