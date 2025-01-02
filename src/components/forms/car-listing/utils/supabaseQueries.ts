import { supabase } from "@/integrations/supabase/client";

export const insertCarListing = async (carData: any) => {
  console.log('Inserting car listing with data:', carData);
  
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