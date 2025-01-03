import { CarListingFormData } from "@/types/forms";
import { ValidationError } from "../types/submission";

export const validateFormData = (data: CarListingFormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  if (!data.address) {
    errors.push({ field: 'address', message: 'Address is required' });
  }
  if (!data.mobileNumber) {
    errors.push({ field: 'mobileNumber', message: 'Mobile number is required' });
  }
  if (!data.serviceHistoryType) {
    errors.push({ field: 'serviceHistoryType', message: 'Service history type is required' });
  }
  if (!data.seatMaterial) {
    errors.push({ field: 'seatMaterial', message: 'Seat material is required' });
  }
  if (!data.numberOfKeys) {
    errors.push({ field: 'numberOfKeys', message: 'Number of keys is required' });
  }
  if (!data.uploadedPhotos || data.uploadedPhotos.length === 0) {
    errors.push({ field: 'uploadedPhotos', message: 'At least one photo is required' });
  }

  return errors;
};