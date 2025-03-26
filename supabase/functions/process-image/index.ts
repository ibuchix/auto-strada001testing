
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const carId = formData.get('carId') as string

    if (!file || !type || !carId) {
      throw new Error('Missing required fields')
    }

    // Validate file type based on upload category
    const isServiceDocument = type.includes('service_document');
    const allowedTypes = isServiceDocument 
      ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
      : ALLOWED_IMAGE_TYPES;
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed for ${isServiceDocument ? 'documents' : 'images'}`);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload original image
    const fileExt = file.name.split('.').pop()
    const filePath = `${carId}/${type}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      throw new Error('Failed to upload file')
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    // Log the upload
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
      })

    // Update car's photos or documents
    if (type.includes('service_document')) {
      // For service documents, we return the URL without updating the car record
      // as these are handled separately in the ServiceHistorySection component
    } else if (type.includes('additional_')) {
      await supabase
        .from('cars')
        .update({
          additional_photos: supabase.sql`array_append(additional_photos, ${filePath})`
        })
        .eq('id', carId)
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
        .eq('id', carId)
    }

    return new Response(
      JSON.stringify({ 
        message: 'File uploaded successfully',
        filePath,
        publicUrl
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process file', 
        details: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
})
