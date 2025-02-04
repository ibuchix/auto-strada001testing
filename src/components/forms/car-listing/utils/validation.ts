import { CarListingFormData } from "@/types/forms";

export type ValidationError = {
  field: string;
  message: string;
};

export const validateFormData = (data: CarListingFormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Personal Details
  if (!data.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  if (!data.address) {
    errors.push({ field: 'address', message: 'Address is required' });
  }
  if (!data.mobileNumber) {
    errors.push({ field: 'mobileNumber', message: 'Mobile number is required' });
  }

  // Vehicle Status
  if (data.isDamaged && !data.damageReports?.length) {
    errors.push({ field: 'damageReports', message: 'Please document any damage' });
  }

  // Service History
  if (!data.serviceHistoryType) {
    errors.push({ field: 'serviceHistoryType', message: 'Service history type is required' });
  }

  // Additional Info
  if (!data.seatMaterial) {
    errors.push({ field: 'seatMaterial', message: 'Seat material is required' });
  }
  if (!data.numberOfKeys) {
    errors.push({ field: 'numberOfKeys', message: 'Number of keys is required' });
  }

  // Photos
  if (!data.uploadedPhotos || data.uploadedPhotos.length === 0) {
    errors.push({ field: 'uploadedPhotos', message: 'At least one photo is required' });
  }

  // Rim Photos
  if (!data.rimPhotosComplete) {
    errors.push({ field: 'rimPhotos', message: 'All rim photos are required' });
  }

  return errors;
};

export const getFormProgress = (data: CarListingFormData): number => {
  const totalSteps = 8; // Total number of major sections
  let completedSteps = 0;

  // Personal Details
  if (data.name && data.address && data.mobileNumber) {
    completedSteps++;
  }

  // Vehicle Status
  if (!data.isDamaged || (data.isDamaged && data.damageReports?.length)) {
    completedSteps++;
  }

  // Features
  if (Object.values(data.features || {}).some(Boolean)) {
    completedSteps++;
  }

  // Service History
  if (data.serviceHistoryType) {
    completedSteps++;
  }

  // Additional Info
  if (data.seatMaterial && data.numberOfKeys) {
    completedSteps++;
  }

  // Photos
  if (data.uploadedPhotos?.length) {
    completedSteps++;
  }

  // Rim Photos
  if (data.rimPhotosComplete) {
    completedSteps++;
  }

  // Seller Notes
  if (data.sellerNotes) {
    completedSteps++;
  }

  return Math.round((completedSteps / totalSteps) * 100);
};