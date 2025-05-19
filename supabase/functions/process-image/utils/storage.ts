
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function uploadFileToStorage(file: File, carId: string, type: string) {
  // Get Supabase URLs from environment
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required environment variables for Supabase');
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user ID from car record
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('seller_id')
    .eq('id', carId)
    .single();

  if (carError) {
    console.error('Error getting car details:', carError);
    throw new Error(`Car not found: ${carId}`);
  }

  const userId = car.seller_id;
  
  if (!userId) {
    throw new Error('Car has no associated seller');
  }

  // Create a standardized file path
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `cars/${userId}/${carId}/${type}/${fileName}`;

  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Upload the file
  const { error: uploadError } = await supabase.storage
    .from('car-images')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`);
  }

  return { filePath, supabase };
}

export async function logFileUpload(
  supabase: any,
  carId: string,
  filePath: string,
  type: string,
  file: File
) {
  try {
    const { error } = await supabase
      .from('car_file_uploads')
      .insert({
        car_id: carId,
        file_path: filePath,
        file_type: type,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size
      });

    if (error) {
      console.error('Error logging file upload:', error);
      // Don't throw error, just log it - we don't want to fail the whole upload
    }
  } catch (error) {
    console.error('Exception logging file upload:', error);
    // Don't throw error, just log it
  }
}

export async function updateCarRecord(
  supabase: any,
  type: string,
  filePath: string,
  carId: string
) {
  try {
    // Different logic based on photo type
    if (type.startsWith('required_') || type.includes('rim_')) {
      // Get current required_photos JSONB object
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('required_photos')
        .eq('id', carId)
        .single();
        
      if (getError) {
        console.error('Error fetching car required_photos:', getError);
      } else {
        // Update the required_photos object with the new photo
        const requiredPhotos = car?.required_photos || {};
        requiredPhotos[type] = filePath;
        
        // Update the car record with the modified JSONB
        const { error: updateError } = await supabase
          .from('cars')
          .update({ required_photos: requiredPhotos })
          .eq('id', carId);
          
        if (updateError) {
          console.error('Error updating car required_photos:', updateError);
        }
      }
    } else if (type === 'additional_photos') {
      // Get current additional_photos array
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('additional_photos')
        .eq('id', carId)
        .single();
        
      if (getError) {
        console.error('Error fetching car additional_photos:', getError);
      } else {
        // Update the additional_photos array with the new photo
        let additionalPhotos = car?.additional_photos || [];
        if (!Array.isArray(additionalPhotos)) {
          additionalPhotos = [];
        }
        additionalPhotos.push(filePath);
        
        // Update the car record with the modified array
        const { error: updateError } = await supabase
          .from('cars')
          .update({ additional_photos: additionalPhotos })
          .eq('id', carId);
          
        if (updateError) {
          console.error('Error updating car additional_photos:', updateError);
        }
      }
    }
  } catch (error) {
    console.error('Exception updating car record:', error);
    // Don't throw error, just log it
  }
}
