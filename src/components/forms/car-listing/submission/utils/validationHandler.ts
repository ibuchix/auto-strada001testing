
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for validation handling
 * - 2024-07-24: Enhanced validation with fallback mechanisms and improved error messages
 * - 2024-07-24: Added retrieval of valuation data from multiple possible sources
 * - 2024-07-28: Improved mileage validation with better fallbacks and error handling
 * - 2024-07-30: Enhanced error handling to prevent silent failures and transaction stalling
 */

import { SubmissionErrorType } from "../types";
import { CACHE_KEYS, getFromCache } from "@/services/offlineCacheService";

/**
 * Process and validate vehicle valuation data with fallback mechanisms
 * @returns Validated valuation data
 * @throws SubmissionErrorType if validation fails
 */
export const validateValuationData = (): any => {
  console.log('Validating valuation data...');
  
  // First try the primary storage location
  let valuationData = localStorage.getItem('valuationData');
  
  // If not found, try alternative locations
  if (!valuationData) {
    console.log('Primary valuation data not found, trying alternatives...');
    
    // Try from the cache service
    const cachedData = getFromCache(CACHE_KEYS.VALUATION_DATA);
    if (cachedData) {
      console.log('Found valuation data in cache service');
      valuationData = typeof cachedData === 'string' ? cachedData : JSON.stringify(cachedData);
    }
    
    // If still not found, try to rebuild from individual components
    if (!valuationData) {
      console.log('Attempting to reconstruct valuation data from components...');
      const tempVIN = localStorage.getItem('tempVIN');
      const tempMileage = localStorage.getItem('tempMileage');
      const tempGearbox = localStorage.getItem('tempGearbox');
      
      if (tempVIN && tempMileage) {
        console.log('Found VIN and mileage, reconstructing basic valuation data');
        const reconstructedData = {
          vin: tempVIN,
          mileage: parseInt(tempMileage),
          transmission: tempGearbox || 'manual',
          // Include any route state data if navigated from valuation result
          ...(window.history.state?.usr?.valuationData || {})
        };
        
        // Check if we have enough data for a valid reconstruction
        if (reconstructedData.make && reconstructedData.model && reconstructedData.year) {
          console.log('Successfully reconstructed valuation data');
          valuationData = JSON.stringify(reconstructedData);
          
          // Save the reconstructed data for future use
          localStorage.setItem('valuationData', valuationData);
        }
      }
    }
  } else {
    console.log('Found primary valuation data');
  }
  
  if (!valuationData) {
    console.error('No valuation data found after all recovery attempts');
    throw {
      message: "Vehicle valuation data not found",
      description: "Please complete the valuation process first. You'll be redirected to start over.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = '/sellers'
      }
    } as SubmissionErrorType;
  }

  let parsedData;
  try {
    parsedData = JSON.parse(valuationData);
    console.log('Successfully parsed valuation data:', parsedData);
    
    // Validate minimum required fields to ensure usable data
    if (!parsedData.vin || !parsedData.make || !parsedData.model || !parsedData.year) {
      console.error('Valuation data missing critical fields');
      throw new Error('Incomplete valuation data');
    }
    
  } catch (error) {
    console.error('Error parsing valuation data:', error);
    throw {
      message: "Invalid valuation data format",
      description: "The stored valuation data is corrupted. Please complete the valuation process again.",
      action: {
        label: "Start Over",
        onClick: () => window.location.href = '/sellers'
      }
    } as SubmissionErrorType;
  }

  return parsedData;
};

/**
 * Validates mileage data from localStorage with improved fallback
 * @throws SubmissionErrorType if validation fails
 * @returns Validated mileage as a number
 */
export const validateMileageData = (): number => {
  console.log('Validating mileage data...');
  
  // Try to get mileage from various sources
  let mileage: number | null = null;
  let mileageSource = '';
  
  // First, try direct localStorage access
  const storedMileage = localStorage.getItem('tempMileage');
  if (storedMileage) {
    const parsedMileage = Number(storedMileage);
    if (!isNaN(parsedMileage)) {
      mileage = parsedMileage;
      mileageSource = 'localStorage';
      console.log('Found mileage in localStorage:', mileage);
    } else {
      console.warn('Mileage from localStorage is not a valid number:', storedMileage);
    }
  } 
  // Then try from valuation data
  else {
    try {
      const valuationData = localStorage.getItem('valuationData');
      if (valuationData) {
        const parsedData = JSON.parse(valuationData);
        if (parsedData.mileage !== undefined && parsedData.mileage !== null) {
          const parsedMileage = Number(parsedData.mileage);
          if (!isNaN(parsedMileage)) {
            mileage = parsedMileage;
            mileageSource = 'valuationData';
            console.log('Found mileage in valuationData:', mileage);
            
            // Save it for future use
            localStorage.setItem('tempMileage', String(mileage));
          } else {
            console.warn('Mileage from valuationData is not a valid number:', parsedData.mileage);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting mileage from valuation data:', error);
    }
  }
  
  // Third, try from cached form data
  if ((mileage === null || isNaN(mileage)) && mileage !== 0) {
    const formData = getFromCache(CACHE_KEYS.FORM_PROGRESS);
    if (formData && typeof formData === 'object' && 'mileage' in formData) {
      const parsedMileage = Number(formData.mileage);
      if (!isNaN(parsedMileage)) {
        mileage = parsedMileage;
        mileageSource = 'formCache';
        console.log('Found mileage in form cache:', mileage);
        
        // Save it for future use
        localStorage.setItem('tempMileage', String(mileage));
      } else {
        console.warn('Mileage from form cache is not a valid number:', formData.mileage);
      }
    }
  }
  
  // Final validation
  if ((mileage === null || isNaN(mileage)) && mileage !== 0) {
    console.error('No valid mileage information found after all recovery attempts');
    throw {
      message: "Missing vehicle mileage information",
      description: "Please complete the vehicle valuation first. You'll be redirected to start the process.",
      action: {
        label: "Start Valuation",
        onClick: () => window.location.href = '/sellers'
      }
    } as SubmissionErrorType;
  }
  
  console.log(`Mileage validation successful: ${mileage} (source: ${mileageSource})`);
  return mileage as number;
};
