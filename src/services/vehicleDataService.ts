/**
 * Changes made:
 * - 2025-04-06: Created centralized vehicle data service
 * - 2025-04-06: Implements standardized storage/retrieval of vehicle data
 * - 2025-04-06: Handles type validation and format conversion
 * - 2025-04-06: Supports backward compatibility with legacy storage formats
 * - 2025-04-06: Enhanced applyVehicleDataToForm with better type conversion and debugging
 */

import { toast } from "sonner";
import { toNumberValue } from "@/utils/typeConversion";

// Define a standard vehicle data interface
export interface VehicleData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  transmission?: "manual" | "automatic";
  engineCapacity?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  cached?: boolean;
  timestamp?: string;
}

// Storage keys
const STORAGE_KEYS = {
  VEHICLE_DATA: 'valuationData',
  LEGACY_VIN: 'tempVIN',
  LEGACY_MILEAGE: 'tempMileage',
  LEGACY_GEARBOX: 'tempGearbox'
};

/**
 * Store vehicle data with standardized format
 */
export function storeVehicleData(data: VehicleData): boolean {
  if (!data || !data.vin) {
    console.error('Cannot store invalid vehicle data', data);
    return false;
  }

  try {
    // Add timestamp for tracking
    const enrichedData: VehicleData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // Store in standardized format
    localStorage.setItem(STORAGE_KEYS.VEHICLE_DATA, JSON.stringify(enrichedData));
    
    // Also store in legacy format for backward compatibility
    localStorage.setItem(STORAGE_KEYS.LEGACY_VIN, data.vin);
    if (data.mileage) localStorage.setItem(STORAGE_KEYS.LEGACY_MILEAGE, data.mileage.toString());
    if (data.transmission) localStorage.setItem(STORAGE_KEYS.LEGACY_GEARBOX, data.transmission);
    
    console.log('Stored vehicle data:', enrichedData);
    return true;
  } catch (error) {
    console.error('Failed to store vehicle data:', error);
    return false;
  }
}

/**
 * Retrieve vehicle data with proper type handling
 */
export function getVehicleData(): VehicleData | null {
  try {
    // Try to get data from the standardized storage first
    const dataString = localStorage.getItem(STORAGE_KEYS.VEHICLE_DATA);
    
    if (dataString) {
      const parsedData = JSON.parse(dataString);
      
      // Ensure numeric fields are proper numbers
      const validatedData: VehicleData = {
        ...parsedData,
        year: parsedData.year ? toNumberValue(parsedData.year) : undefined,
        mileage: parsedData.mileage ? toNumberValue(parsedData.mileage) : undefined,
        valuation: parsedData.valuation ? toNumberValue(parsedData.valuation) : undefined,
        reservePrice: parsedData.reservePrice ? toNumberValue(parsedData.reservePrice) : undefined,
        averagePrice: parsedData.averagePrice ? toNumberValue(parsedData.averagePrice) : undefined
      };
      
      return validatedData;
    }
    
    // Fall back to legacy format if standardized format is not available
    return getLegacyVehicleData();
  } catch (error) {
    console.error('Error retrieving vehicle data:', error);
    return null;
  }
}

/**
 * Try to reconstruct vehicle data from legacy storage format
 */
function getLegacyVehicleData(): VehicleData | null {
  const vin = localStorage.getItem(STORAGE_KEYS.LEGACY_VIN);
  if (!vin) return null;
  
  const mileageStr = localStorage.getItem(STORAGE_KEYS.LEGACY_MILEAGE);
  const gearbox = localStorage.getItem(STORAGE_KEYS.LEGACY_GEARBOX) as "manual" | "automatic" | null;
  
  return {
    vin,
    mileage: mileageStr ? parseInt(mileageStr, 10) : undefined,
    transmission: gearbox || undefined
  };
}

/**
 * Clear vehicle data from all storage formats
 */
export function clearVehicleData(): void {
  localStorage.removeItem(STORAGE_KEYS.VEHICLE_DATA);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_VIN);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_MILEAGE);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_GEARBOX);
}

/**
 * Check if we have complete vehicle data stored
 */
export function hasCompleteVehicleData(): boolean {
  const data = getVehicleData();
  return Boolean(
    data && 
    data.vin && 
    data.make && 
    data.model && 
    data.year
  );
}

/**
 * Migrate legacy data to the new standardized format
 */
export function migrateLegacyData(): void {
  try {
    // Check if we already have standardized data
    if (localStorage.getItem(STORAGE_KEYS.VEHICLE_DATA)) {
      return; // No need to migrate if we already have standardized data
    }
    
    const legacyData = getLegacyVehicleData();
    if (legacyData && legacyData.vin) {
      storeVehicleData(legacyData);
      console.log('Migrated legacy vehicle data');
    }
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }
}

// Run migration when the module loads
migrateLegacyData();

/**
 * Apply vehicle data to a form with improved error handling and type conversion
 * @param form The react-hook-form instance
 * @param showToast Whether to show toast notifications
 * @returns Boolean indicating success
 */
export function applyVehicleDataToForm(form: any, showToast: boolean = true): boolean {
  try {
    const data = getVehicleData();
    if (!data || !data.vin) {
      if (showToast) {
        toast.error("No vehicle data found", {
          description: "Please complete a VIN check first to auto-fill details"
        });
      }
      console.error('No valid vehicle data found for auto-fill');
      return false;
    }
    
    console.log('Applying vehicle data to form:', data);
    
    // Apply available fields with proper type handling
    if (data.make) {
      console.log(`Setting make to: ${data.make}`);
      form.setValue('make', data.make);
    }
    
    if (data.model) {
      console.log(`Setting model to: ${data.model}`);
      form.setValue('model', data.model);
    }
    
    if (data.year) {
      const yearValue = toNumberValue(data.year);
      console.log(`Setting year to: ${yearValue} (original: ${data.year})`);
      form.setValue('year', yearValue);
    }
    
    if (data.mileage) {
      const mileageValue = toNumberValue(data.mileage);
      console.log(`Setting mileage to: ${mileageValue} (original: ${data.mileage})`);
      form.setValue('mileage', mileageValue);
    }
    
    if (data.vin) {
      console.log(`Setting VIN to: ${data.vin}`);
      form.setValue('vin', data.vin);
    }
    
    if (data.transmission) {
      console.log(`Setting transmission to: ${data.transmission}`);
      form.setValue('transmission', data.transmission);
    }
    
    // Try to set engineCapacity if available
    if (data.engineCapacity) {
      const engineValue = toNumberValue(data.engineCapacity);
      console.log(`Setting engineCapacity to: ${engineValue} (original: ${data.engineCapacity})`);
      form.setValue('engineCapacity', engineValue);
    }
    
    if (showToast) {
      const carDescription = `${data.year || ''} ${data.make || ''} ${data.model || ''}`.trim();
      toast.success("Vehicle details auto-filled", {
        description: `Successfully populated data for ${carDescription || 'vehicle'}`
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error applying vehicle data to form:', error);
    if (showToast) {
      toast.error("Failed to auto-fill vehicle details", {
        description: "Please try again or enter details manually"
      });
    }
    return false;
  }
}
