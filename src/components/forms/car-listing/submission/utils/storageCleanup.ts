
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for cleaning up localStorage
 */

/**
 * Cleans up all temporary form data from localStorage
 */
export const cleanupFormStorage = () => {
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('formProgress');
};
