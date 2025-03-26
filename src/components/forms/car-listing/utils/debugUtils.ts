
/**
 * Utility functions for debugging form data
 * These replace the diagnostic logging functions
 */

export const debugMileageData = (): number => {
  try {
    const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
    console.log('Current mileage data:', mileage);
    return mileage;
  } catch (error) {
    console.error('Error reading mileage data:', error);
    return 0;
  }
};

export const logAllLocalStorage = (): void => {
  try {
    console.log('All localStorage items:');
    Object.keys(localStorage).forEach(key => {
      console.log(`${key}: ${localStorage.getItem(key)}`);
    });
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
};
