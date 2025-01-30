import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListingRequest {
  valuationData: any;
  userId: string;
  vin: string;
  mileage: number;
  transmission: string;
}

serve(async (req) => {
  console.log('Create listing request received:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { valuationData, userId, vin, mileage, transmission } = await req.json() as ListingRequest;
    console.log('Request parameters:', { userId, vin, mileage, transmission });

    if (!valuationData || !userId || !vin || !mileage) {
      throw new Error('Missing required fields');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create the car listing
    const { data: listing, error: listingError } = await supabase
      .from('cars')
      .insert({
        seller_id: userId,
        title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
        vin: vin,
        mileage: mileage,
        transmission: transmission,
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        price: valuationData.valuation || valuationData.averagePrice,
        valuation_data: valuationData,
        is_draft: true
      })
      .select()
      .single();

    if (listingError) {
      console.error('Error creating listing:', listingError);
      throw listingError;
    }

    console.log('Listing created successfully:', listing);

    return new Response(
      JSON.stringify({
        success: true,
        data: listing,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-car-listing:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to create listing',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});