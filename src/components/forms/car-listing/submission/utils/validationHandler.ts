
/**
 * Changes made:
 * - 2024-06-07: Created initial validation handlers
 * - 2024-08-25: Enhanced validation with better error messages
 * - 2024-08-14: Updated to use standard application error architecture
 * - 2024-08-15: Refactored to use the new error factory for consistency
 * - 2028-05-16: Updated imports for ValidationErrorCode
 * - 2025-04-06: Fixed error code usage to address TypeScript errors
 */

import { createFieldError, createFormError } from "@/errors/factory";
import { ErrorCode } from "@/errors/types";

/**
 * Validates that valuation data exists in localStorage
 */
export const validateValuationData = () => {
  const valuationDataStr = localStorage.getItem("valuationData");
  
  if (!valuationDataStr) {
    throw createFormError("Missing valuation data", { 
      code: ErrorCode.MISSING_VALUATION,
      description: "Please complete the vehicle valuation process first."
    });
  }

  try {
    const valuationData = JSON.parse(valuationDataStr);
    
    // Check for minimum required fields
    if (!valuationData.make || !valuationData.model || !valuationData.year) {
      throw createFormError("Incomplete valuation data", {
        code: ErrorCode.INCOMPLETE_FORM,
        description: "The vehicle valuation data is incomplete. Please restart the valuation process."
      });
    }
    
    return valuationData;
  } catch (error) {
    console.error("Error parsing valuation data:", error);
    throw createFormError("Invalid valuation data", {
      code: ErrorCode.INVALID_FORMAT,
      description: "The stored valuation data is invalid. Please restart the valuation process."
    });
  }
};

/**
 * Validates that mileage data exists in localStorage
 */
export const validateMileageData = () => {
  const mileageStr = localStorage.getItem("tempMileage");
  
  if (!mileageStr) {
    throw createFormError("Missing mileage information", {
      code: ErrorCode.REQUIRED_FIELD,
      description: "Please complete the vehicle valuation with mileage information first."
    });
  }

  try {
    const mileage = parseInt(mileageStr, 10);
    
    if (isNaN(mileage) || mileage <= 0) {
      throw createFieldError("mileage", "Invalid mileage value", {
        code: ErrorCode.INVALID_FORMAT,
        description: "The mileage must be a positive number."
      });
    }
    
    return mileage;
  } catch (error) {
    console.error("Error parsing mileage data:", error);
    throw createFieldError("mileage", "Invalid mileage format", {
      code: ErrorCode.INVALID_FORMAT,
      description: "The mileage value is in an invalid format."
    });
  }
};
