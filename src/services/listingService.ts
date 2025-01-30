import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const createCarListing = async (
  valuationData: any,
  userId: string,
  vin: string,
  mileage: number,
  transmission: string
) => {
  console.log('Creating car listing with data:', {
    userId,
    vin,
    mileage,
    transmission,
    valuationData
  });

  try {
    const { data, error } = await supabase.functions.invoke('create-car-listing', {
      body: {
        valuationData,
        userId,
        vin,
        mileage,
        transmission
      }
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.message || "Failed to create listing");
    }

    console.log('Listing created successfully:', data);
    return data.data;
  } catch (error: any) {
    console.error('Error creating listing:', error);
    toast.error(error.message || "Failed to create listing");
    throw error;
  }
};