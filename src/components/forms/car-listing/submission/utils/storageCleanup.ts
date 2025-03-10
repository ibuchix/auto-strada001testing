
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for cleaning up localStorage
 * - 2024-06-13: Added bid-related cleanup
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
  localStorage.removeItem('lastBidAmount');
  localStorage.removeItem('bidHistory');
};

/**
 * Cleans up only bid-related data from localStorage
 */
export const cleanupBidStorage = () => {
  localStorage.removeItem('lastBidAmount');
  localStorage.removeItem('bidHistory');
};
