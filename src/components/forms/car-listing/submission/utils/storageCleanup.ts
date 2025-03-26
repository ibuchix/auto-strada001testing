
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for cleaning up localStorage
 * - 2024-06-13: Added bid-related cleanup
 * - 2024-06-14: Added additional documentation for bid cleanup functions
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
 * This is used after a successful bid placement to ensure
 * the temporary bid data doesn't interfere with future bids
 */
export const cleanupBidStorage = () => {
  localStorage.removeItem('lastBidAmount');
  localStorage.removeItem('bidHistory');
};
