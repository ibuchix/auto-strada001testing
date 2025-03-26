
/**
 * Car Service with type casting for now to fix build errors
 */
import { supabase } from "@/integrations/supabase/client";
import { CarListing, AuctionStatus } from "@/types/forms";

// Helper to cast database results to the correct type
const castToCarListing = (data: any): CarListing => {
  return {
    ...data,
    auction_status: data.auction_status as AuctionStatus
  };
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
