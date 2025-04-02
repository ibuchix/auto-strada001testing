
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
    // Get the reservation ID from localStorage
    const reservationId = localStorage.getItem('vinReservationId');
    if (!reservationId) {
      throw new Error("No valid VIN reservation found. Please start the process again.");
    }

    // Verify the reservation is still valid
    const { data: reservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('status', 'active')
      .single();

    if (reservationError || !reservation) {
      throw new Error("Your VIN reservation has expired. Please start the process again.");
    }

    // Use the dedicated create-car-listing edge function
    const { data, error } = await supabase.functions.invoke('create-car-listing', {
      body: {
        valuationData,
        userId,
        vin,
        mileage,
        transmission,
        reservationId
      }
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.message || "Failed to create listing");
    }

    // Clear the reservation ID from localStorage after successful creation
    localStorage.removeItem('vinReservationId');

    console.log('Listing created successfully:', data);
    return data.data;
  } catch (error: any) {
    console.error('Error creating listing:', error);
    toast.error(error.message || "Failed to create listing");
    throw error;
  }
};
