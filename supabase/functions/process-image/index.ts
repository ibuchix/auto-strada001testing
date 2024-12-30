import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Sharp from 'https://esm.sh/sharp@0.32.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const THUMBNAIL_SIZE = 300;

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

    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Process image with Sharp
    const image = Sharp(buffer)
    const metadata = await image.metadata()

    // Validate dimensions and resize if necessary
    if (metadata.width && metadata.height) {
      if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
        image.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }

    // Generate thumbnail
    const thumbnail = image.clone().resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'centre'
    })

    // Process both images
    const [processedBuffer, thumbnailBuffer] = await Promise.all([
      image.toBuffer(),
      thumbnail.toBuffer()
    ])

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload processed image and thumbnail
    const fileExt = file.name.split('.').pop()
    const filePath = `${carId}/${type}.${fileExt}`
    const thumbnailPath = `${carId}/thumb_${type}.${fileExt}`

    const [imageUpload, thumbnailUpload] = await Promise.all([
      supabase.storage
        .from('car-files')
        .upload(filePath, processedBuffer, {
          contentType: file.type,
          upsert: true
        }),
      supabase.storage
        .from('car-files')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: file.type,
          upsert: true
        })
    ])

    if (imageUpload.error || thumbnailUpload.error) {
      throw new Error('Failed to upload files')
    }

    // Log the upload
    await supabase
      .from('car_file_uploads')
      .insert({
        car_id: carId,
        file_path: filePath,
        file_type: type,
        upload_status: 'completed',
        image_metadata: metadata,
        thumbnail_path: thumbnailPath
      })

    // Update car's photos
    if (type.includes('additional_')) {
      await supabase
        .from('cars')
        .update({
          additional_photos: supabase.sql`array_append(additional_photos, ${filePath})`,
          thumbnails: supabase.sql`jsonb_set(
            thumbnails,
            array[${type}],
            ${thumbnailPath}
          )`
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
          )`,
          thumbnails: supabase.sql`jsonb_set(
            thumbnails,
            array[${type}],
            ${thumbnailPath}
          )`
        })
        .eq('id', carId)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Image processed and uploaded successfully',
        filePath,
        thumbnailPath,
        metadata 
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
        error: 'Failed to process image', 
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