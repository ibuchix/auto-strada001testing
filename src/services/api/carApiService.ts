
/**
 * Car API Service
 * 
 * Changes made:
 * - 2025-11-05: Integrated with robust API client for automatic retries and error normalization
 * - Enhanced error handling and type safety
 */

import { CarEntity, CarListingFormData } from "@/types/forms";
import { isCarEntity, isCarEntityArray } from "@/utils/typeGuards";
import { apiClient } from "./apiClientService";
import { toast } from "sonner";

/**
 * Fetch a car by its ID from the API
 * @param id The ID of the car to fetch
 * @returns The car entity or null if not found or invalid
 */
export const fetchCarById = async (id: string): Promise<CarEntity | null> => {
  try {
    const response = await apiClient.get(`/api/cars/${id}`, {
      errorMessage: 'Failed to fetch car details'
    });
    
    if (response.error || !response.data) {
      return null;
    }
    
    // Use type guard to ensure data is valid
    if (isCarEntity(response.data)) {
      return response.data;
    } else {
      console.error('Invalid car data structure received from API');
      return null;
    }
  } catch (error) {
    console.error('Error in fetchCarById:', error);
    return null;
  }
};

/**
 * Fetch all cars from the API
 * @returns Array of car entities or empty array if error
 */
export const fetchCars = async (): Promise<CarEntity[]> => {
  try {
    const response = await apiClient.get('/api/cars', {
      errorMessage: 'Failed to fetch cars'
    });
    
    if (response.error || !response.data) {
      return [];
    }
    
    // Use type guard to filter out invalid entries
    if (isCarEntityArray(response.data)) {
      return response.data;
    } else {
      // Filter out invalid car entries individually
      const validCars: CarEntity[] = [];
      for (const car of response.data) {
        if (isCarEntity(car)) {
          validCars.push(car);
        } else {
          console.warn('Invalid car entity found in response:', car);
        }
      }
      return validCars;
    }
  } catch (error) {
    console.error('Error in fetchCars:', error);
    return [];
  }
};

/**
 * Create a new car listing
 * @param carData The car data to create
 * @returns The created car entity or null if error
 */
export const createCarListing = async (carData: CarListingFormData): Promise<CarEntity | null> => {
  try {
    const response = await apiClient.post('/api/cars', carData, {
      errorMessage: 'Failed to create car listing',
      retries: 2,
      successMessage: 'Car listing created successfully'
    });
    
    if (response.error || !response.data) {
      return null;
    }
    
    // Use type guard to ensure data is valid
    if (isCarEntity(response.data)) {
      return response.data;
    } else {
      console.error('Invalid car data structure received from API after creation');
      return null;
    }
  } catch (error) {
    console.error('Error in createCarListing:', error);
    return null;
  }
};
