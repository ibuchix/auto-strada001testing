/**
 * Fixes validation handler function calls
 */

import { toast } from "sonner";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

export interface ValidationError {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Validates that valuation data exists in localStorage and is valid
 */
export const validateValuationData = (): any => {
  try {
    const valuationDataStr = localStorage.getItem('valuationData');
    if (!valuationDataStr) {
      throw {
        message: "No valuation data found",
        description: "Please complete the valuation process first",
      };
    }

    const valuationData = JSON.parse(valuationDataStr);
    
    // Basic validation of required fields
    if (!valuationData.make || !valuationData.model || !valuationData.year) {
      throw {
        message: "Incomplete valuation data",
        description: "Required vehicle information is missing, please restart valuation",
      };
    }

    return valuationData;
  } catch (error: any) {
    // If error is already formatted, rethrow it
    if (error.message && error.description) {
      throw error;
    }

    // Otherwise format the error
    console.error("Valuation data validation error:", error);
    
    // Log diagnostic info
    logDiagnostic(
      'VALIDATION_ERROR', 
      'Failed to validate valuation data', 
      { error: error.message || 'Unknown error' },
      undefined,
      'ERROR'
    );
    
    throw {
      message: "Invalid valuation data",
      description: "Please restart the valuation process",
    };
  }
};

/**
 * Validates that mileage data exists in localStorage
 */
export const validateMileageData = (): number => {
  try {
    const mileageStr = localStorage.getItem('tempMileage');
    if (!mileageStr) {
      throw {
        message: "No mileage data found",
        description: "Please complete the valuation process first",
      };
    }

    const mileage = parseInt(mileageStr, 10);
    if (isNaN(mileage)) {
      throw {
        message: "Invalid mileage data",
        description: "The mileage value is not a valid number",
      };
    }

    return mileage;
  } catch (error: any) {
    // If error is already formatted, rethrow it
    if (error.message && error.description) {
      throw error;
    }

    console.error("Mileage validation error:", error);
    
    // Log diagnostic info
    logDiagnostic(
      'VALIDATION_ERROR', 
      'Failed to validate mileage data', 
      { error: error.message || 'Unknown error' },
      undefined,
      'ERROR'
    );
    
    throw {
      message: "Invalid mileage data",
      description: "Please restart the valuation process",
    };
  }
};

/**
 * Validates VIN data in localStorage
 */
export const validateVinData = (): string => {
  try {
    const vin = localStorage.getItem('tempVIN');
    if (!vin) {
      throw {
        message: "No VIN data found",
        description: "Please complete the valuation process first",
      };
    }

    return vin;
  } catch (error: any) {
    // If error is already formatted, rethrow it
    if (error.message && error.description) {
      throw error;
    }

    console.error("VIN validation error:", error);
    
    // Log diagnostic info
    logDiagnostic(
      'VALIDATION_ERROR', 
      'Failed to validate VIN data', 
      { error: error.message || 'Unknown error' },
      undefined,
      'ERROR'
    );
    
    throw {
      message: "Invalid VIN data",
      description: "Please restart the valuation process",
    };
  }
};
