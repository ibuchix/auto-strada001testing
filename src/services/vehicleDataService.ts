
/**
 * Centralized vehicle data service
 * Provides consistent storage and retrieval of vehicle data across the application
 * 
 * Created: 2025-04-05
 */

import { toast } from "sonner";

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
