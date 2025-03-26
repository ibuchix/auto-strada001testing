
/**
 * Created cleanup utilities file to provide functions referenced in tests
 * 
 * Changes made:
 * - 2025-08-10: Added cleanupFormStorage function to fix import errors
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

// Add cleanupFormStorage function that was missing
export const cleanupFormStorage = () => {
  // Clean up form-related local storage
  localStorage.removeItem('formValues');
  localStorage.removeItem('formCurrentStep');
  localStorage.removeItem('tempUploads');
  localStorage.removeItem('tempPhotos');
  localStorage.removeItem('draftId');
  
  // Call the standard cleanup function too for backwards compatibility
  cleanupStorage();
};
