
/**
 * Car API Service
 * 
 * Provides methods for interacting with the car API endpoints
 * Uses type guards to ensure type safety with API responses
 */

import { CarEntity, CarListingFormData } from "@/types/forms";
import { isCarEntity, isCarEntityArray } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch a car by its ID from the API
 * @param id The ID of the car to fetch
 * @returns The car entity or null if not found or invalid
 */
export const fetchCarById = async (id: string): Promise<CarEntity | null> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      console.error('Error fetching car:', error);
      return null;
    }
    
    // Use type guard to ensure data is valid
    if (isCarEntity(data)) {
      return data;
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
    const { data, error } = await supabase
      .from('cars')
      .select('*');
      
    if (error || !data) {
      console.error('Error fetching cars:', error);
      return [];
    }
    
    // Use type guard to filter out invalid entries
    if (isCarEntityArray(data)) {
      return data;
    } else {
      // Filter out invalid car entries individually
      const validCars: CarEntity[] = [];
      for (const car of data) {
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
    const { data, error } = await supabase
      .from('cars')
      .insert([carData])
      .select()
      .single();
      
    if (error || !data) {
      console.error('Error creating car listing:', error);
      return null;
    }
    
    // Use type guard to ensure data is valid
    if (isCarEntity(data)) {
      return data;
    } else {
      console.error('Invalid car data structure received from API after creation');
      return null;
    }
  } catch (error) {
    console.error('Error in createCarListing:', error);
    return null;
  }
};
