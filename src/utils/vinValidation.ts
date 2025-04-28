
/**
 * VIN validation utilities
 * Created: 2025-04-28
 */

/**
 * Normalizes a VIN by removing spaces and converting to uppercase
 */
export function normalizeVIN(vin: string): string {
  if (!vin) return '';
  return vin.replace(/\s+/g, '').toUpperCase();
}

/**
 * Validates whether a string is a valid Vehicle Identification Number (VIN)
 */
export function isValidVIN(vin: string): boolean {
  if (!vin) return false;
  
  // Normalize the VIN first
  const normalizedVin = normalizeVIN(vin);
  
  // Most VINs are 17 characters, but some older or international models might be different
  // We're being fairly permissive here
  return normalizedVin.length >= 10 && normalizedVin.length <= 17 && /^[A-Z0-9]+$/i.test(normalizedVin);
}

/**
 * Gets a specific error message for invalid VINs
 * Returns null if the VIN is valid
 */
export function getVINErrorMessage(vin: string): string | null {
  if (!vin) return 'VIN is required';
  
  const normalizedVin = normalizeVIN(vin);
  
  if (normalizedVin.length < 10) {
    return 'VIN is too short (minimum 10 characters)';
  }
  
  if (normalizedVin.length > 17) {
    return 'VIN is too long (maximum 17 characters)';
  }
  
  if (!/^[A-Z0-9]+$/i.test(normalizedVin)) {
    return 'VIN can only contain letters and numbers';
  }
  
  return null;
}

/**
 * Extracts basic vehicle info from a VIN
 * Note: This is a simplified implementation and won't work for all manufacturers
 */
export function extractBasicVehicleInfo(vin: string): {
  manufacturer: string;
  country: string;
  year: number | null;
} {
  const normalizedVin = normalizeVIN(vin);
  
  // Default values
  const result = {
    manufacturer: 'Unknown',
    country: 'Unknown',
    year: null
  };
  
  // Only proceed if we have a VIN of reasonable length
  if (normalizedVin.length < 10) return result;
  
  // First character often indicates country of origin
  const firstChar = normalizedVin.charAt(0);
  switch (firstChar) {
    case 'J': result.country = 'Japan'; break;
    case 'K': result.country = 'Korea'; break;
    case 'L': result.country = 'China'; break;
    case 'S': 
      // S can be UK, Germany, or others
      if (normalizedVin.startsWith('SB')) result.country = 'UK'; 
      else result.country = 'Germany';
      break;
    case 'V': result.country = 'France/Spain'; break;
    case 'W': result.country = 'Germany'; break;
    case '1':
    case '4':
    case '5': result.country = 'USA'; break;
    case '2': result.country = 'Canada'; break;
    case '3': result.country = 'Mexico'; break;
    default: result.country = 'Other';
  }
  
  // Manufacturer is often in the first 3 characters
  const firstThree = normalizedVin.substring(0, 3);
  if (firstThree === 'WBA' || firstThree === 'WBS' || firstThree === 'WBY') {
    result.manufacturer = 'BMW';
  } else if (firstThree === 'WVW' || firstThree === 'WV2') {
    result.manufacturer = 'Volkswagen';
  } else if (firstThree === 'WD3' || firstThree === 'WDB' || firstThree === 'WDD') {
    result.manufacturer = 'Mercedes-Benz';
  } else if (firstThree === 'WAU' || firstThree === 'WA1') {
    result.manufacturer = 'Audi';
  } else if (firstThree === 'SB1') {
    result.manufacturer = 'Toyota';
  } else if (firstThree === 'JN1' || firstThree === 'JF1') {
    result.manufacturer = 'Nissan';
  } else if (firstThree === 'JMZ') {
    result.manufacturer = 'Mazda';
  } else if (firstThree === 'JHM') {
    result.manufacturer = 'Honda';
  }
  
  // Try to extract model year from the 10th character
  // This follows the standard pattern for model years since 2010
  if (normalizedVin.length >= 10) {
    const yearChar = normalizedVin.charAt(9);
    // A is 2010, B is 2011, etc. (I, O, Q, U, Z are skipped)
    const yearMap: Record<string, number> = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029, 'Y': 2030,
      '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
      '6': 2006, '7': 2007, '8': 2008, '9': 2009, '0': 2000
    };
    
    if (yearMap[yearChar]) {
      result.year = yearMap[yearChar];
    }
  }
  
  return result;
}
