/**
 * Validation utilities for form submission
 */
import { toast } from "sonner";
import { validateVIN, validateCarForm, carListingValidationSchema } from "@/validation/carListing";
import { CarListingFormData } from "@/types/forms";
import { ZodError } from "zod";
import { validateFormData } from "../../utils/validation";
import { ValidationError } from "../../submission/errors";

/**
 * Validate that valuation data exists in localStorage
 * @returns The parsed valuation data object
 * @throws ValidationError if valuation data is missing or invalid
 */
export const validateValuationData = () => {
  try {
    const valuationDataString = localStorage.getItem('valuationData');
    if (!valuationDataString) {
      throw new ValidationError(
        "Missing valuation data",
        "Please complete the vehicle valuation first",
        {
          label: "Start Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      );
    }
    
    const data = JSON.parse(valuationDataString);
    
    // Check for required fields
    if (!data.make || !data.model || !data.vin) {
      throw new ValidationError(
        "Incomplete valuation data",
        "The valuation data is missing important information",
        {
          label: "Restart Valuation",
          onClick: () => window.location.href = "/sellers"
        }
      );
    }
    
    return data;
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Error validating valuation data:', error);
    throw new ValidationError(
      "Invalid valuation data",
      "Please complete the vehicle valuation again",
      {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    );
  }
};

/**
 * Validate that mileage data was entered during valuation
 * @returns The mileage value
 * @throws ValidationError if mileage data is missing
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
    
    throw new ValidationError(
      "Missing mileage data",
      "Please complete the vehicle valuation with mileage information",
      {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    );
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Error validating mileage data:', error);
    throw new ValidationError(
      "Invalid mileage data",
      "Please complete the vehicle valuation again with mileage information",
      {
        label: "Start Valuation",
        onClick: () => window.location.href = "/sellers"
      }
    );
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

/**
 * Validate the complete car listing form using the form validation utility
 * @param formData The car listing form data to validate
 * @throws ValidationError with specific field error messages if validation fails
 */
export const validateCompleteCarForm = (formData: CarListingFormData) => {
  const errors = validateFormData(formData);
  
  if (errors.length > 0) {
    // Get the first error to display
    const firstError = errors[0];
    throw new ValidationError(
      "Form validation failed",
      firstError.message,
      {
        label: "Fix Issue",
        onClick: () => {
          const element = document.getElementById(firstError.field);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            element.focus();
          } else {
            window.scrollTo(0, 0);
          }
        }
      }
    );
  }
  
  // Perform additional validation with the schema
  try {
    const result = carListingValidationSchema.parse({
      vin: formData.vin,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      mileage: formData.mileage,
      price: formData.price
    });
    
    return true;
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        "Invalid form data",
        firstError.message,
        {
          label: "Fix Issue",
          onClick: () => {
            const fieldId = firstError.path[0]?.toString();
            if (fieldId) {
              const element = document.getElementById(fieldId);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.focus();
              } else {
                window.scrollTo(0, 0);
              }
            }
          }
        }
      );
    }
    
    throw error;
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

/**
 * Validate the complete car listing form before submission
 * @param formData The car listing form data to validate
 * @returns True if form is valid, false otherwise
 * @throws Error with validation message if validation fails critically
 */
export const validateCompleteCarFormOld = (formData: CarListingFormData): boolean => {
  try {
    // Use Zod schema to validate core properties
    const result = carListingValidationSchema.parse({
      vin: formData.vin,
      year: formData.year,
      mileage: formData.mileage,
      price: formData.price,
      transmission: formData.transmission
    });
    
    // Basic validation for other required fields
    if (!formData.make || !formData.model) {
      throw {
        message: "Missing car details",
        description: "Make and model are required fields",
        action: {
          label: "Complete Details",
          onClick: () => window.scrollTo(0, 0)
        }
      };
    }
    
    // Photo validation
    if (!formData.uploadedPhotos || formData.uploadedPhotos.length === 0) {
      throw {
        message: "Missing photos",
        description: "At least one photo is required",
        action: {
          label: "Add Photos",
          onClick: () => {
            const photoSection = document.getElementById('photo-upload');
            if (photoSection) {
              photoSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      };
    }
    
    // Damage reports validation
    if (formData.isDamaged && (!formData.damageReports || formData.damageReports.length === 0)) {
      throw {
        message: "Missing damage reports",
        description: "Please document any damage",
        action: {
          label: "Add Damage Reports",
          onClick: () => {
            const damageSection = document.getElementById('damage-reports');
            if (damageSection) {
              damageSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      };
    }
    
    return true;
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      throw {
        message: "Invalid form data",
        description: firstError.message,
        action: {
          label: "Fix Issue",
          onClick: () => {
            const fieldId = firstError.path[0]?.toString();
            if (fieldId) {
              const element = document.getElementById(fieldId);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.focus();
              }
            }
          }
        }
      };
    } else if (error.message && error.description) {
      throw error;
    } else {
      console.error('Form validation error:', error);
      throw {
        message: "Invalid form data",
        description: "Please check all required fields",
        action: {
          label: "Review Form",
          onClick: () => window.scrollTo(0, 0)
        }
      };
    }
  }
};
