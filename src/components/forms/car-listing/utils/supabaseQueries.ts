import { supabase } from "@/integrations/supabase/client";

export const insertCarListing = async (carData: any) => {
  console.log('Attempting to insert car listing with data:', carData);
  
  if (!carData.title) {
    console.error('Missing required title in car data');
    throw new Error('Car title is required');
  }

  const { data, error } = await supabase
    .from('cars')
    .insert(carData)
    .select(`
      id,
      title,
      make,
      model,
      year,
      price,
      mileage,
      status,
      created_at
    `)
    .single();

  if (error) {
    console.error('Error inserting car listing:', error);
    throw error;
  }

  console.log('Car listing inserted successfully:', data);
  return data;
};