
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from './cors.ts';

export async function uploadFileToStorage(file: File, carId: string, type: string) {
  console.log(`Storage: Starting upload for file ${file.name} (${file.size} bytes) to type ${type}`);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get user ID from auth session or fallback to admin ID for server-side uploads
  const userId = Deno.env.get('ADMIN_USER_ID') ?? 'system';
  
  const fileExt = file.name.split('.').pop();
  // Use standardized path structure
  const filePath = `cars/${userId}/${carId}/${type}/${crypto.randomUUID()}.${fileExt}`;

  console.log(`Storage: Uploading file to ${filePath}`);

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('car-images')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  console.log(`Storage: Upload successful, data:`, uploadData);
  return { filePath, supabase };
}

export async function logFileUpload(supabase: any, carId: string, filePath: string, type: string, file: File) {
  console.log(`Storage: Creating database record for ${filePath}`);
  
  try {
    const { error, data } = await supabase
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
      
    if (error) {
      console.error('Database log error:', error);
      
      // Try again with simpler data structure if metadata caused the issue
      try {
        const { error: retryError, data: retryData } = await supabase
          .from('car_file_uploads')
          .insert({
            car_id: carId,
            file_path: filePath,
            file_type: file.type,
            category: type,
            upload_status: 'completed'
          });
          
        if (retryError) {
          console.error('Retry database log error:', retryError);
        } else {
          console.log('Retry database log success:', retryData);
        }
      } catch (retryError) {
        console.error('Exception in retry database log:', retryError);
      }
    } else {
      console.log('Database log success:', data);
    }
  } catch (error) {
    console.error('Exception in logFileUpload:', error);
  }
}

export async function updateCarRecord(supabase: any, type: string, filePath: string, carId: string) {
  console.log(`Storage: Updating car record for ${type}`);
  
  try {
    if (type.includes('service_document')) {
      // Service documents are handled separately
      console.log('Storage: Service document, skipping car record update');
      return;
    }

    if (type.includes('additional_') || type === 'additional_photos') {
      // For additional photos, append to the array
      try {
        // First get the current additional_photos array
        console.log('Storage: Fetching current additional_photos for car:', carId);
        const { data: car, error: getError } = await supabase
          .from('cars')
          .select('additional_photos')
          .eq('id', carId)
          .single();
          
        if (getError) {
          console.error('Error getting car record:', getError);
        } else {
          // Update the additional_photos array
          const additionalPhotos = car.additional_photos || [];
          const photosArray = Array.isArray(additionalPhotos) ? additionalPhotos : [];
          
          if (!photosArray.includes(filePath)) {
            console.log('Storage: Updating additional_photos with new file path');
            const { error: updateError, data: updateData } = await supabase
              .from('cars')
              .update({
                additional_photos: [...photosArray, filePath]
              })
              .eq('id', carId);
              
            if (updateError) {
              console.error('Error updating additional photos:', updateError);
            } else {
              console.log('Storage: Additional photos updated successfully');
            }
          } else {
            console.log('Storage: File path already exists in additional_photos, skipping update');
          }
        }
      } catch (error) {
        console.error('Error updating additional photos:', error);
      }
    } else if (type.includes('rim_') || type.startsWith('required_')) {
      // For rim or required photos, update the required_photos JSONB
      try {
        // First get the current required_photos object
        console.log('Storage: Fetching current required_photos for car:', carId);
        const { data: car, error: getError } = await supabase
          .from('cars')
          .select('required_photos')
          .eq('id', carId)
          .single();
          
        if (getError) {
          console.error('Error getting car record for required photos:', getError);
        } else {
          // Update the required_photos object
          const requiredPhotos = car.required_photos || {};
          requiredPhotos[type] = filePath;
          
          console.log('Storage: Updating required_photos with new file path');
          const { error: updateError, data: updateData } = await supabase
            .from('cars')
            .update({
              required_photos: requiredPhotos
            })
            .eq('id', carId);
            
          if (updateError) {
            console.error('Error updating required photos:', updateError);
          } else {
            console.log('Storage: Required photos updated successfully');
          }
        }
      } catch (error) {
        console.error('Error updating required photos:', error);
      }
    } else if (type.includes('damage_')) {
      // For damage photos, they're handled through damage_reports table
      console.log('Storage: Damage photo, handled separately through damage_reports');
      // We don't need to update the car record directly
    } else {
      console.log(`Storage: Unrecognized type "${type}", no car record update performed`);
    }
  } catch (error) {
    console.error('Exception in updateCarRecord:', error);
  }
}
