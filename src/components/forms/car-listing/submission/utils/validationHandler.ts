
/**
 * Validation utilities for form submission
 */
import { toast } from "sonner";

/**
 * Validate that valuation data exists in localStorage
 * @returns The parsed valuation data object
 * @throws Error if valuation data is missing or invalid
 */
export const validateValuationData = () => {
  try {
    const valuationDataString = localStorage.getItem('valuationData');
    if (!valuationDataString) {
      throw {
        message: "Missing valuation data",
        description: "Please complete the vehicle valuation first",
        action: {
          label: "Start Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      };
    }
    
    const data = JSON.parse(valuationDataString);
    
    // Check for required fields
    if (!data.make || !data.model || !data.vin) {
      throw {
        message: "Incomplete valuation data",
        description: "The valuation data is missing important information",
        action: {
          label: "Restart Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      };
    }
    
    return data;
  } catch (error: any) {
    if (error.message && error.description) {
      throw error;
    }
    console.error('Error validating valuation data:', error);
    throw {
      message: "Invalid valuation data",
      description: "Please complete the vehicle valuation again",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    };
  }
};

/**
 * Validate that mileage data was entered during valuation
 * @returns The mileage value
 * @throws Error if mileage data is missing
 */
export const validateMileageData = () => {
  try {
    // First check tempMileage in localStorage
    const tempMileage = localStorage.getItem('tempMileage');
    if (tempMileage) {
      const mileageValue = parseInt(tempMileage, 10);
      if (!isNaN(mileageValue) && mileageValue > 0) {
        return mileageValue;
      }
    }
    
    // Then check valuation data
    const valuationData = validateValuationData();
    if (valuationData.mileage && !isNaN(parseInt(String(valuationData.mileage), 10))) {
      return parseInt(String(valuationData.mileage), 10);
    }
    
    throw {
      message: "Missing mileage data",
      description: "Please complete the vehicle valuation with mileage information",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    };
  } catch (error: any) {
    if (error.message && error.description) {
      throw error;
    }
    console.error('Error validating mileage data:', error);
    throw {
      message: "Invalid mileage data",
      description: "Please complete the vehicle valuation again with mileage information",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    };
  }
};

/**
 * Get valuation data from localStorage
 * @returns The parsed valuation data object or null if not found
 */
export const getValuationData = () => {
  try {
    const valuationDataString = localStorage.getItem('valuationData');
    if (!valuationDataString) return null;
    return JSON.parse(valuationDataString);
  } catch (error) {
    console.error('Error parsing valuation data:', error);
    return null;
  }
};
