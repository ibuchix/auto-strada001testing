
/**
 * Changes made:
 * - Created an index file to export all photo-related hooks
 * - Makes imports cleaner from other components
 * - Added new hooks from the usePhotoUpload refactoring
 * - 2025-04-05: Added usePhotoUploadSection hook
 */

export { usePhotoManagement } from './usePhotoManagement';
export { usePhotoUploadHandler } from './usePhotoUploadHandler';
export { usePhotoValidation } from './usePhotoValidation';
export { useRequiredPhotosUpload } from './useRequiredPhotosUpload';
export { usePhotoUpload } from './usePhotoUpload';
export { useUploadState } from './useUploadState';
export { useUploadProgress } from './useUploadProgress';
export { useRetryLogic } from './useRetryLogic';
export { usePhotoUploadSection } from './usePhotoUploadSection';
