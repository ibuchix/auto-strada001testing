
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for validation handling
 */

import { SubmissionErrorType } from "../types";

/**
 * Process and validate vehicle valuation data
 * @returns Validated valuation data from localStorage
 * @throws SubmissionErrorType if validation fails
 */
export const validateValuationData = (): any => {
  const valuationData = localStorage.getItem('valuationData');
  
  if (!valuationData) {
    throw {
      message: "Vehicle valuation data not found",
      description: "Please complete the valuation process first. You'll be redirected to start over.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = '/sellers'
      }
    } as SubmissionErrorType;
  }

  return JSON.parse(valuationData);
};

/**
 * Validates mileage data from localStorage
 * @throws SubmissionErrorType if validation fails
 */
export const validateMileageData = (): void => {
  const storedMileage = localStorage.getItem('tempMileage');
  
  if (!storedMileage) {
    throw {
      message: "Missing vehicle mileage information",
      description: "Please complete the vehicle valuation first. You'll be redirected to start the process.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = '/sellers'
      }
    } as SubmissionErrorType;
  }
};
