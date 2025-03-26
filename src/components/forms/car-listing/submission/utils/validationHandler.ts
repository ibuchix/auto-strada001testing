
/**
 * Validation utilities for form submission
 * - 2024-07-24: Added comprehensive validation for valuation data
 * - 2024-07-26: Enhanced mileage validation with fallbacks
 * - 2024-07-28: Added detailed error reporting
 * - 2025-06-15: Removed diagnostic logging
 */

import { SubmissionErrorType } from "../types";

// Simple helper to get mileage with validation
export const validateMileageData = (): number => {
  try {
    // Try to get mileage from localStorage
    const mileageStr = localStorage.getItem('tempMileage');
    
    if (!mileageStr) {
      console.error('No mileage data found in localStorage');
      throw {
        message: "Missing vehicle mileage",
        description: "Please complete the vehicle valuation step first",
        action: {
          label: "Start Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      } as SubmissionErrorType;
    }
    
    const mileage = parseInt(mileageStr, 10);
    
    if (isNaN(mileage)) {
      console.error('Invalid mileage value:', mileageStr);
      throw {
        message: "Invalid mileage data",
        description: "The mileage value is not valid. Please restart the valuation process.",
        action: {
          label: "Start Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      } as SubmissionErrorType;
    }
    
    return mileage;
  } catch (error) {
    if ('message' in error && 'description' in error) {
      throw error;
    }
    
    console.error('Error validating mileage:', error);
    throw {
      message: "Error validating mileage",
      description: "We couldn't validate your vehicle's mileage. Please try restarting the valuation process.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    } as SubmissionErrorType;
  }
};

// Validate that valuation data exists and is valid
export const validateValuationData = (): any => {
  try {
    // Try to get valuation data from localStorage
    const valuationDataStr = localStorage.getItem('valuationData');
    
    if (!valuationDataStr) {
      console.error('No valuation data found in localStorage');
      throw {
        message: "Missing vehicle valuation",
        description: "Please complete the vehicle valuation step first",
        action: {
          label: "Start Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      } as SubmissionErrorType;
    }
    
    let valuationData;
    try {
      valuationData = JSON.parse(valuationDataStr);
    } catch (parseError) {
      console.error('Error parsing valuation data:', parseError);
      throw {
        message: "Invalid valuation data",
        description: "Your vehicle valuation data is corrupted. Please restart the valuation process.",
        action: {
          label: "Start Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      } as SubmissionErrorType;
    }
    
    // Validate minimum required fields
    if (!valuationData.vin || !valuationData.make || !valuationData.model || !valuationData.year) {
      const missingFields = [];
      if (!valuationData.vin) missingFields.push('VIN');
      if (!valuationData.make) missingFields.push('Make');
      if (!valuationData.model) missingFields.push('Model');
      if (!valuationData.year) missingFields.push('Year');
      
      console.error('Missing required valuation fields:', missingFields);
      throw {
        message: "Incomplete valuation data",
        description: `Your vehicle valuation is missing: ${missingFields.join(', ')}. Please restart the valuation process.`,
        action: {
          label: "Start Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      } as SubmissionErrorType;
    }
    
    return valuationData;
  } catch (error) {
    if ('message' in error && 'description' in error) {
      throw error;
    }
    
    console.error('Error validating valuation data:', error);
    throw {
      message: "Error validating vehicle data",
      description: "We couldn't validate your vehicle data. Please try restarting the valuation process.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    } as SubmissionErrorType;
  }
};
