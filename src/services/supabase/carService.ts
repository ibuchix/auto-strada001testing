
/**
 * Car Service with type casting for now to fix build errors
 * Updated: 2025-07-02 - Added saveCarListing and updateCarListing functions
 */
import { supabase } from "@/integrations/supabase/client";
import { CarListing, AuctionStatus, CarListingFormData } from "@/types/forms";

// Helper to cast database results to the correct type
const castToCarListing = (data: any): CarListing => {
  return {
    ...data,
    auction_status: data.auction_status as AuctionStatus
  };
};

/**
 * Save a new car listing to the database
 * @param carData The car data to save
 * @returns The ID of the newly created car listing
 */
export const saveCarListing = async (carData: CarListingFormData): Promise<string> => {
  const { data, error } = await supabase
    .from('cars')
    .insert({
      ...carData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'draft'
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error saving car listing:', error);
    throw new Error(`Failed to save car listing: ${error.message}`);
  }
  
  return data.id;
};

/**
 * Update an existing car listing in the database
 * @param carId The ID of the car listing to update
 * @param carData The car data to update
 * @returns The ID of the updated car listing
 */
export const updateCarListing = async (carId: string, carData: CarListingFormData): Promise<string> => {
  const { error } = await supabase
    .from('cars')
    .update({
      ...carData,
      updated_at: new Date().toISOString()
    })
    .eq('id', carId);
  
  if (error) {
    console.error('Error updating car listing:', error);
    throw new Error(`Failed to update car listing: ${error.message}`);
  }
  
  return carId;
};

export const carService = {
  async getCar(id: string): Promise<CarListing | null> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      console.error('Error fetching car:', error);
      return null;
    }
    
    return castToCarListing(data) as CarListing;
  },
  
  // Type assertion to get around type issues for now
  async getCarsByStatus(status: string): Promise<CarListing[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('status', status);
      
    if (error || !data) {
      console.error('Error fetching cars by status:', error);
      return [];
    }
    
    return data.map(car => castToCarListing(car)) as CarListing[];
  },
  
  // Stub method to fix build errors
  async getCarCountByStatus(): Promise<Record<string, number>> {
    try {
      // We'll return an empty object for now
      return {};
    } catch (error) {
      console.error('Error getting car count by status:', error);
      return {};
    }
  }
};
