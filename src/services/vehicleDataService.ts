
/**
 * Centralized vehicle data service
 * Provides consistent storage and retrieval of vehicle data across the application
 * 
 * Created: 2025-04-05
 * Updated: 2025-04-05 - Added applyVehicleDataToForm function for form integration
 */

import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export interface VehicleData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  transmission?: string;
  engineCapacity?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  cached?: boolean;
}

const STORAGE_KEY = 'vehicleData';

/**
 * Store vehicle data in localStorage
 * @param data Vehicle data to store
 * @returns boolean indicating if storage was successful
 */
export function storeVehicleData(data: VehicleData): boolean {
  try {
    // Save full object to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Stored vehicle data:', data);
    return true;
  } catch (error) {
    console.error('Failed to store vehicle data:', error);
    toast.error("Failed to save vehicle data");
    return false;
  }
}

/**
 * Get vehicle data from localStorage
 * @returns Vehicle data or null if not found
 */
export function getVehicleData(): VehicleData | null {
  try {
    const dataString = localStorage.getItem(STORAGE_KEY);
    if (!dataString) return null;
    
    const parsedData = JSON.parse(dataString);
    console.log('Retrieved vehicle data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Failed to retrieve vehicle data:', error);
    return null;
  }
}

/**
 * Clear vehicle data from localStorage
 */
export function clearVehicleData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Cleared vehicle data');
  } catch (error) {
    console.error('Failed to clear vehicle data:', error);
  }
}

/**
 * Check if we have complete vehicle data for auto-filling forms
 * @returns boolean indicating if we have essential data
 */
export function hasCompleteVehicleData(): boolean {
  const data = getVehicleData();
  return !!(
    data?.vin && 
    data?.make && 
    data?.model && 
    data?.year && 
    data?.mileage
  );
}

/**
 * Check if vehicle data contains valuation information
 * @returns boolean indicating if valuation data is present
 */
export function hasValuationData(): boolean {
  const data = getVehicleData();
  return !!(
    data?.valuation || 
    data?.reservePrice || 
    data?.averagePrice
  );
}

/**
 * Apply stored vehicle data to a form
 * @param form React Hook Form instance
 * @param showToast Whether to show a toast notification on success/failure
 * @returns boolean indicating if application was successful
 */
export function applyVehicleDataToForm(form: UseFormReturn<CarListingFormData>, showToast: boolean = false): boolean {
  try {
    const data = getVehicleData();
    
    if (!data) {
      if (showToast) {
        toast.error("No vehicle data found to apply");
      }
      return false;
    }
    
    // Apply each field from vehicle data to the form
    if (data.make) form.setValue('make', data.make);
    if (data.model) form.setValue('model', data.model);
    if (data.year && typeof data.year === 'number') form.setValue('year', data.year);
    if (data.vin) form.setValue('vin', data.vin);
    if (data.mileage && typeof data.mileage === 'number') form.setValue('mileage', data.mileage);
    if (data.transmission) form.setValue('transmission', data.transmission as "manual" | "automatic");
    
    console.log('Applied vehicle data to form:', data);
    
    if (showToast) {
      toast.success("Vehicle data applied to form");
    }
    
    return true;
  } catch (error) {
    console.error('Failed to apply vehicle data to form:', error);
    
    if (showToast) {
      toast.error("Failed to apply vehicle data to form");
    }
    
    return false;
  }
}
