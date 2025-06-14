
/**
 * Security Validation Service
 * Created: 2025-05-30 - Comprehensive input validation and sanitization
 * Updated: 2025-06-20 - [SECURITY NOTE] This file exceeds 325 lines. Please refactor to smaller modules for maintainability!
 * [SECURITY] WARNING: Future enhancements should avoid duplicating server-side validation! Ensure backend functions perform all checks too.
 */

import { supabase } from "@/integrations/supabase/client";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates and sanitizes car listing data
 */
export const validateCarListingData = async (formData: any): Promise<ValidationResult> => {
  const errors: string[] = [];
  const sanitizedData: any = {};

  try {
    // Validate required fields
    if (!formData.make?.trim()) {
      errors.push("Make is required");
    } else {
      sanitizedData.make = sanitizeTextInput(formData.make);
    }

    if (!formData.model?.trim()) {
      errors.push("Model is required");
    } else {
      sanitizedData.model = sanitizeTextInput(formData.model);
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (!formData.year || formData.year < 1970 || formData.year > currentYear + 1) {
      errors.push("Valid year between 1970 and " + (currentYear + 1) + " is required");
    } else {
      sanitizedData.year = parseInt(formData.year);
    }

    // Validate mileage
    if (formData.mileage === undefined || formData.mileage < 0 || formData.mileage > 999999) {
      errors.push("Valid mileage between 0 and 999,999 is required");
    } else {
      sanitizedData.mileage = parseInt(formData.mileage);
    }

    // Validate VIN if provided
    if (formData.vin) {
      const vinValid = await validateVIN(formData.vin);
      if (!vinValid) {
        errors.push("Invalid VIN format");
      } else {
        sanitizedData.vin = formData.vin.toUpperCase();
      }
    }

    // Validate reserve price
    if (!formData.reservePrice || formData.reservePrice < 100 || formData.reservePrice > 10000000) {
      errors.push("Reserve price must be between 100 and 10,000,000");
    } else {
      sanitizedData.reservePrice = parseFloat(formData.reservePrice);
    }

    // Sanitize text fields
    if (formData.sellerNotes) {
      sanitizedData.sellerNotes = sanitizeTextInput(formData.sellerNotes);
      if (sanitizedData.sellerNotes.length > 200) {
        errors.push("Seller notes cannot exceed 200 characters");
      }
    }

    if (formData.address) {
      sanitizedData.address = sanitizeTextInput(formData.address);
    }

    if (formData.sellerName) {
      sanitizedData.sellerName = sanitizeTextInput(formData.sellerName);
    }

    // Validate mobile number
    if (formData.mobileNumber) {
      const cleanMobile = formData.mobileNumber.replace(/\D/g, '');
      if (cleanMobile.length < 9 || cleanMobile.length > 15) {
        errors.push("Invalid mobile number format");
      } else {
        sanitizedData.mobileNumber = cleanMobile;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };

  } catch (error) {
    console.error("Validation error:", error);
    return {
      isValid: false,
      errors: ["Validation failed due to unexpected error"]
    };
  }
};

/**
 * Validates file upload security using client-side checks
 */
export const validateFileUpload = async (
  file: File,
  userId: string
): Promise<FileValidationResult> => {
  try {
    // Client-side checks first
    if (!file) {
      return { isValid: false, error: "No file provided" };
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB` 
      };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed" 
      };
    }

    // Check file extension
    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
    if (!allowedExtensions.test(file.name)) {
      return { 
        isValid: false, 
        error: "Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are allowed" 
      };
    }

    // Additional client-side rate limiting check
    const uploadCount = await checkRecentUploads(userId);
    if (uploadCount > 20) {
      return { 
        isValid: false, 
        error: "Upload rate limit exceeded. Maximum 20 uploads per hour" 
      };
    }

    return { isValid: true };

  } catch (error) {
    console.error("File validation error:", error);
    return { isValid: false, error: "File validation failed due to unexpected error" };
  }
};

/**
 * Check recent uploads for rate limiting
 */
const checkRecentUploads = async (userId: string): Promise<number> => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('car_file_uploads')
      .select('id')
      .gte('created_at', oneHourAgo)
      .eq('car_id', userId); // This is a simplified check

    if (error) {
      console.error("Error checking upload count:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Error in checkRecentUploads:", error);
    return 0;
  }
};

/**
 * Validates VIN format and uniqueness
 */
export const validateVIN = async (vin: string): Promise<boolean> => {
  try {
    // Basic format validation
    if (!vin || vin.length !== 17) {
      return false;
    }

    // VIN character validation (no I, O, Q)
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinPattern.test(vin.toUpperCase())) {
      return false;
    }

    // Check for uniqueness using existing function
    const { data, error } = await supabase.rpc('is_vin_available', {
      p_vin: vin.toUpperCase()
    });

    if (error) {
      console.error("VIN availability check error:", error);
      return false;
    }

    return data === true;

  } catch (error) {
    console.error("VIN validation error:", error);
    return false;
  }
};

/**
 * Sanitizes text input to prevent XSS and other attacks
 */
export const sanitizeTextInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>&"']/g, '') // Remove XSS characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return sanitized;
};

/**
 * Validates numeric input within bounds
 */
export const validateNumericInput = (
  value: any,
  min: number,
  max: number,
  fieldName: string
): { isValid: boolean; error?: string; value?: number } => {
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (numValue < min || numValue > max) {
    return { 
      isValid: false, 
      error: `${fieldName} must be between ${min} and ${max}` 
    };
  }
  
  return { isValid: true, value: numValue };
};

/**
 * Rate limiting check using client-side logic
 */
export const checkRateLimit = async (
  endpoint: string,
  maxRequests: number = 100,
  windowMinutes: number = 60
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return false;
    }

    // Simplified rate limiting using localStorage for client-side tracking
    const rateLimitKey = `rate_limit_${endpoint}_${session.user.id}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    const stored = localStorage.getItem(rateLimitKey);
    if (stored) {
      const { count, timestamp } = JSON.parse(stored);
      
      if (now - timestamp < windowMs) {
        if (count >= maxRequests) {
          return false;
        }
        localStorage.setItem(rateLimitKey, JSON.stringify({
          count: count + 1,
          timestamp: timestamp
        }));
      } else {
        localStorage.setItem(rateLimitKey, JSON.stringify({
          count: 1,
          timestamp: now
        }));
      }
    } else {
      localStorage.setItem(rateLimitKey, JSON.stringify({
        count: 1,
        timestamp: now
      }));
    }

    return true;

  } catch (error) {
    console.error("Rate limiting error:", error);
    return true; // Allow on error to avoid blocking users
  }
};
