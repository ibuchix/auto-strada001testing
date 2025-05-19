
export function validateUpload(file: File | null, type: string) {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validImageTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, and WebP images are allowed.`);
  }

  // Validate file size (max 10MB)
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
  }

  // Validate category
  const validCategories = [
    'additional_photos', 
    'front_view', 
    'rear_view',
    'driver_side',
    'passenger_side',
    'dashboard',
    'interior_front',
    'interior_rear',
    'warning_light', 
    'required_front_view',
    'required_rear_view',
    'required_driver_side',
    'required_passenger_side',
    'required_dashboard',
    'required_interior_front',
    'required_interior_rear',
    'rim_front_left',
    'rim_front_right',
    'rim_rear_left',
    'rim_rear_right',
    'damage_photos'
  ];

  // If type contains any of the valid categories, it's valid
  const isValidCategory = validCategories.some(category => type.includes(category));
  
  if (!isValidCategory) {
    // Not throwing error, just logging warning - don't want to break uploads
    console.warn(`Warning: Unrecognized image category: ${type}`);
  }
}
