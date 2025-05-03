
/**
 * Photo Helper Utilities
 * Created: 2025-07-25
 * 
 * Helper functions for handling photo uploads and field management
 */

import { CarListingFormData } from "@/types/forms";
import { UseFormSetValue, UseFormGetValues } from "react-hook-form";

/**
 * Sets an arbitrary photo field in the form
 */
export const setPhotoField = (
  fieldName: string, 
  value: string, 
  setValue: UseFormSetValue<CarListingFormData>
) => {
  // Use this dynamic approach to set photo fields
  setValue(fieldName as any, value, { shouldDirty: true });
};

/**
 * Sets multiple photo fields at once
 */
export const setMultiplePhotoFields = (
  photos: Record<string, string>,
  setValue: UseFormSetValue<CarListingFormData>
) => {
  Object.entries(photos).forEach(([field, value]) => {
    setPhotoField(field, value, setValue);
  });
};

/**
 * Updates the vehiclePhotos object with all individual photo fields
 */
export const updateVehiclePhotos = (
  setValue: UseFormSetValue<CarListingFormData>,
  getValues: UseFormGetValues<CarListingFormData>
) => {
  const values = getValues();
  
  const vehiclePhotos: Record<string, string> = {
    frontView: values.frontView || '',
    rearView: values.rearView || '',
    driverSide: values.driverSide || '',
    passengerSide: values.passengerSide || '',
    dashboard: values.dashboard || '',
    interiorFront: values.interiorFront || '',
    interiorRear: values.interiorRear || '',
  };
  
  setValue('vehiclePhotos', vehiclePhotos, { shouldDirty: true });
};
