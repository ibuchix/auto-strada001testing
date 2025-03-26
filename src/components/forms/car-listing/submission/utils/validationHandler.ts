/**
 * Changes made:
 * - 2028-06-01: Created dedicated validation and error handling utilities for submission process
 */

import { SubmissionErrorType } from "../types";
import { debugMileageData } from "../../utils/debugUtils";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

/**
 * Validates that the VIN and mileage data are consistent and correct
 * between localStorage, form data, and valuation data
 */
export const validateMileageData = (): void => {
  // Get diagnostic data first
  const diagnosticData = debugMileageData();
  
  // Log rich diagnostics
  console.info("Validating mileage data consistency...", diagnosticData);
  
  // Get value from localStorage directly
  const tempMileage = localStorage.getItem('tempMileage');
  
  // Compare with valuation data
  const valuationDataStr = localStorage.getItem('valuationData');
  if (!valuationDataStr) {
    logDiagnostic('VALIDATION_ERROR', 'Missing valuation data during mileage validation', {
      tempMileage
    }, undefined, 'ERROR');
    
    throw {
      message: "Missing valuation data",
      description: "The vehicle valuation data is missing. Please complete the valuation process first.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = '/sellers'
      }
    } as SubmissionErrorType;
  }
  
  try {
    const valuationData = JSON.parse(valuationDataStr);
    
    // Check if mileage is present in valuation data
    if (!valuationData.mileage && valuationData.mileage !== 0) {
      logDiagnostic('VALIDATION_ERROR', 'Missing mileage in valuation data', {
        valuationData,
        tempMileage
      }, undefined, 'ERROR');
      
      throw {
        message: "Invalid valuation data",
        description: "The mileage information is missing from the valuation data. Please retry the valuation.",
        action: {
          label: "Start Valuation",
          onClick: () => {
            localStorage.removeItem('valuationData');
            window.location.href = '/sellers';
          }
        }
      } as SubmissionErrorType;
    }
    
    // If tempMileage exists, check consistency with valuation data
    if (tempMileage) {
      const parsedTempMileage = parseInt(tempMileage, 10);
      const parsedValuationMileage = parseInt(String(valuationData.mileage), 10);
      
      // Allow for small differences due to parsing or rounding
      if (Math.abs(parsedTempMileage - parsedValuationMileage) > 1) {
        console.warn('Mileage mismatch detected:', {
          tempMileage: parsedTempMileage,
          valuationMileage: parsedValuationMileage
        });
        
        logDiagnostic('VALIDATION_WARNING', 'Mileage mismatch detected', {
          tempMileage: parsedTempMileage,
          valuationMileage: parsedValuationMileage,
          diff: parsedTempMileage - parsedValuationMileage
        }, undefined, 'WARNING');
        
        // Use valuation data as source of truth, but don't throw error
        // This is just a warning, not an error condition
      }
    }
    
    logDiagnostic('VALIDATION_SUCCESS', 'Mileage validation successful', {
      mileage: valuationData.mileage
    });
    
  } catch (error) {
    if (error.message && error.description) {
      // This is already a formatted SubmissionErrorType, re-throw it
      throw error;
    }
    
    // Otherwise, it's a JSON parsing error or similar
    logDiagnostic('VALIDATION_ERROR', 'Error validating mileage data', {
      error: error.message,
      valuationDataStr: valuationDataStr ? valuationDataStr.substring(0, 50) + '...' : null
    }, undefined, 'ERROR');
    
    throw {
      message: "Valuation data is invalid",
      description: "Please retry the vehicle valuation process.",
      action: {
        label: "Start Valuation",
        onClick: () => {
          localStorage.removeItem('valuationData');
          window.location.href = '/sellers';
        }
      }
    } as SubmissionErrorType;
  }
};

/**
 * Validates that the valuation data exists and is complete
 */
export const validateValuationData = (): any => {
  const valuationDataStr = localStorage.getItem('valuationData');
  
  if (!valuationDataStr) {
    logDiagnostic('VALIDATION_ERROR', 'Missing valuation data', {}, undefined, 'ERROR');
    
    throw {
      message: "Missing valuation data",
      description: "The vehicle valuation data is missing. Please complete the valuation process first.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = '/sellers'
      }
    } as SubmissionErrorType;
  }
  
  try {
    const valuationData = JSON.parse(valuationDataStr);
    
    // Check essential fields
    const requiredFields = ['make', 'model', 'year', 'vin'];
    const missingFields = requiredFields.filter(field => !valuationData[field]);
    
    if (missingFields.length > 0) {
      logDiagnostic('VALIDATION_ERROR', 'Incomplete valuation data', {
        missingFields,
        valuationData
      }, undefined, 'ERROR');
      
      throw {
        message: "Incomplete valuation data",
        description: `Missing required information: ${missingFields.join(', ')}. Please retry the valuation.`,
        action: {
          label: "Start Valuation",
          onClick: () => {
            localStorage.removeItem('valuationData');
            window.location.href = '/sellers';
          }
        }
      } as SubmissionErrorType;
    }
    
    // Validate valuation amounts exist
    if (!valuationData.valuation && !valuationData.reservePrice) {
      logDiagnostic('VALIDATION_ERROR', 'Missing price information', {
        valuationData
      }, undefined, 'ERROR');
      
      throw {
        message: "Missing price information",
        description: "The valuation data does not contain price information. Please retry the valuation.",
        action: {
          label: "Start Valuation",
          onClick: () => {
            localStorage.removeItem('valuationData');
            window.location.href = '/sellers';
          }
        }
      } as SubmissionErrorType;
    }
    
    logDiagnostic('VALIDATION_SUCCESS', 'Valuation data validation successful', {
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year
    });
    
    return valuationData;
  } catch (error) {
    if (error.message && error.description) {
      // This is already a formatted SubmissionErrorType, re-throw it
      throw error;
    }
    
    // Otherwise, it's a JSON parsing error or similar
    logDiagnostic('VALIDATION_ERROR', 'Error parsing valuation data', {
      error: error.message,
      valuationDataStr: valuationDataStr ? valuationDataStr.substring(0, 50) + '...' : null
    }, undefined, 'ERROR');
    
    throw {
      message: "Valuation data is invalid",
      description: "Please retry the vehicle valuation process.",
      action: {
        label: "Start Valuation",
        onClick: () => {
          localStorage.removeItem('valuationData');
          window.location.href = '/sellers';
        }
      }
    } as SubmissionErrorType;
  }
};
