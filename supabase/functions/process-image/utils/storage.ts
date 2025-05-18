
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from './cors.ts';

export async function uploadFileToStorage(file: File, carId: string, type: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get user ID from auth session or fallback to admin ID for server-side uploads
  const userId = Deno.env.get('ADMIN_USER_ID') ?? 'system';
  
  const fileExt = file.name.split('.').pop();
  // Use standardized path structure
  const filePath = `cars/${userId}/${carId}/${type}/${crypto.randomUUID()}.${fileExt}`;

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
      file_type: file.type,
      category: type,
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
    // Service documents are handled separately
    return;
  }

  if (type.includes('additional_') || type === 'additional_photos') {
    // For additional photos, append to the array
    await supabase
      .from('cars')
      .update({
        additional_photos: supabase.sql`array_append(COALESCE(additional_photos, '[]'::jsonb), ${filePath})`
      })
      .eq('id', carId);
  } else if (type.includes('rim_') || type.startsWith('required_')) {
    // For rim or required photos, update the required_photos JSONB
    await supabase
      .from('cars')
      .update({
        required_photos: supabase.sql`jsonb_set(
          COALESCE(required_photos, '{}'::jsonb),
          array[${type}],
          to_jsonb(${filePath}::text)
        )`
      })
      .eq('id', carId);
  } else if (type.includes('damage_')) {
    // For damage photos, they're handled through damage_reports table
    // We don't need to update the car record directly
  }
}
