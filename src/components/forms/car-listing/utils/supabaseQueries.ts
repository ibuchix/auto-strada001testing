import { supabase } from "@/integrations/supabase/client";

export const SELECTED_COLUMNS = `
  id,
  seller_id,
  title,
  description,
  vin,
  mileage,
  price,
  status,
  make,
  model,
  year,
  valuation_data,
  is_damaged,
  is_registered_in_poland,
  features,
  seat_material,
  number_of_keys,
  has_tool_pack,
  has_documentation,
  is_selling_on_behalf,
  has_private_plate,
  finance_amount,
  service_history_type,
  seller_notes,
  required_photos,
  is_draft,
  name,
  address,
  mobile_number
`;

export const insertCarListing = async (carData: any) => {
  const { data, error } = await supabase
    .from('cars')
    .insert(carData)
    .select(SELECTED_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};