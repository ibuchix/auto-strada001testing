
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from './cors.ts';

export async function uploadFileToStorage(file: File, carId: string, type: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const fileExt = file.name.split('.').pop();
  const filePath = `${carId}/${type}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('car-images')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    throw new Error('Failed to upload file');
  }

  return { filePath, supabase };
}

export async function logFileUpload(supabase: any, carId: string, filePath: string, type: string, file: File) {
  await supabase
    .from('car_file_uploads')
    .insert({
      car_id: carId,
      file_path: filePath,
      file_type: type,
      upload_status: 'completed',
      image_metadata: {
        size: file.size,
        type: file.type,
        name: file.name
      }
    });
}

export async function updateCarRecord(supabase: any, type: string, filePath: string, carId: string) {
  if (type.includes('service_document')) {
    // Service documents are handled separately in the ServiceHistorySection component
    return;
  }

  if (type.includes('additional_')) {
    await supabase
      .from('cars')
      .update({
        additional_photos: supabase.sql`array_append(additional_photos, ${filePath})`
      })
      .eq('id', carId);
  } else {
    await supabase
      .from('cars')
      .update({
        required_photos: supabase.sql`jsonb_set(
          required_photos,
          array[${type}],
          ${filePath}
        )`
      })
      .eq('id', carId);
  }
}
