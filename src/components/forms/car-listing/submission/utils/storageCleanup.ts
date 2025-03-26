
/**
 * Created cleanup utilities file to provide functions referenced in tests
 */

export const cleanupBidStorage = () => {
  // Implementation would clear bid-related temporary storage
  localStorage.removeItem('tempBids');
};

// Add this function since it's referenced in tests
export const cleanupStorage = () => {
  localStorage.removeItem('tempFormData');
  localStorage.removeItem('tempUploads');
};
