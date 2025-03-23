
// Enhanced car listing creation function with improved field handling
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
  reservationId?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { valuationData, userId, vin, mileage, transmission, reservationId } = requestData as ListingRequest;
    
    console.log('Request parameters:', { userId, vin, mileage, transmission });

    if (!valuationData || !userId || !vin || !mileage) {
      throw new Error('Missing required fields');
    }

    // Initialize Supabase client with increased timeout
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          // Set timeout to 4 minutes (240000ms)
          headers: { 'x-request-timeout': '240000' }
        }
      }
    );

    // Use background processing for the listing creation
    const processListing = async () => {
      try {
        // Log seller information for debugging
        console.log('Creating listing for seller:', userId);
        
        // Check if seller exists and is verified
        const { data: seller, error: sellerError } = await supabase
          .from('sellers')
          .select('id, verification_status')
          .eq('user_id', userId)
          .single();
        
        if (sellerError) {
          console.log('Seller not found, attempting to create seller record...');
          // Create seller record if it doesn't exist
          await supabase
            .from('sellers')
            .insert({
              user_id: userId,
              verification_status: 'verified',
              is_verified: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        } else {
          console.log('Found seller:', seller);
        }

        // Prepare seller name from auth user if available
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
        const sellerName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unnamed Seller';
        
        // Prepare the listing data with both name and seller_name fields for compatibility
        const listingData = {
          seller_id: userId,
          name: sellerName, // For backward compatibility
          seller_name: sellerName, // For database schema
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
        };

        console.log('Creating listing with data:', {
          ...listingData,
          valuation_data: '(omitted for log clarity)'
        });

        // Try to use the security definer function first
        try {
          console.log('Attempting to create listing via security definer function');
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'create_car_listing',
            { p_car_data: listingData }
          );

          if (!rpcError && rpcResult) {
            console.log('Listing created successfully via RPC:', rpcResult);
            return rpcResult;
          }
          
          console.warn('RPC failed, falling back to direct insert:', rpcError);
        } catch (rpcError) {
          console.warn('Exception calling RPC function:', rpcError);
        }

        // Fallback to direct insert
        const { data: listing, error: listingError } = await supabase
          .from('cars')
          .insert(listingData)
          .select()
          .single();

        if (listingError) {
          console.error('Error creating listing:', listingError);
          throw listingError;
        }

        console.log('Listing created successfully via direct insert:', listing);
        return listing;
      } catch (error) {
        console.error('Background processing error:', error);
        throw error;
      }
    };

    // Start the background processing
    const backgroundProcess = processListing();
    
    // Use EdgeRuntime.waitUntil to handle the background task
    EdgeRuntime.waitUntil(backgroundProcess);

    // Return an immediate response while processing continues in background
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Listing creation started',
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 202 // Accepted
      }
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
