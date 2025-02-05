
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValuationRequest {
  operation: 'validate_vin';
  vin: string;
  mileage: number;
  gearbox: string;
  userId?: string;
}

interface ValidationResponse {
  success: boolean;
  data: {
    make?: string;
    model?: string;
    year?: number;
    vin: string;
    transmission?: string;
    valuation?: number;
    averagePrice?: number;
    isExisting?: boolean;
    noData?: boolean;
    error?: string;
  };
}

function calculateMD5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = crypto.subtle.digestSync("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, vin, mileage, gearbox, userId } = await req.json() as ValuationRequest;
    console.log('Processing seller operation:', { operation, vin, mileage, gearbox, userId });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    switch (operation) {
      case 'validate_vin': {
        console.log('Starting VIN validation for:', vin);

        // Log the operation start
        const { data: operationLog, error: logError } = await supabase
          .from('seller_operations')
          .insert({
            seller_id: userId,
            operation_type: 'validate_vin',
            input_data: { vin, mileage, gearbox },
            success: false
          })
          .select()
          .single();

        if (logError) {
          console.error('Failed to log operation:', logError);
        }

        // Check if VIN exists in cars table
        const { data: existingCar } = await supabase
          .from('cars')
          .select('id, title')
          .eq('vin', vin)
          .eq('is_draft', false)
          .maybeSingle();

        if (existingCar) {
          const response = {
            success: true,
            data: {
              vin,
              transmission: gearbox,
              isExisting: true,
              error: 'This vehicle has already been listed'
            }
          };

          // Update operation log
          if (operationLog) {
            await supabase
              .from('seller_operations')
              .update({
                success: true,
                output_data: response,
                error_message: 'Vehicle already listed'
              })
              .eq('id', operationLog.id);
          }

          return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check VIN search history
        const { data: searchHistory } = await supabase
          .from('vin_search_results')
          .select('search_data')
          .eq('vin', vin)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (searchHistory?.search_data) {
          const response = {
            success: true,
            data: {
              ...searchHistory.search_data,
              transmission: gearbox,
              isExisting: false,
              vin
            }
          };

          // Update operation log with cached result
          if (operationLog) {
            await supabase
              .from('seller_operations')
              .update({
                success: true,
                output_data: response,
                error_message: 'Used cached VIN data'
              })
              .eq('id', operationLog.id);
          }

          return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prepare API request
        const apiId = 'AUTOSTRA';
        const apiSecret = Deno.env.get('CAR_API_SECRET');
        if (!apiSecret) {
          throw new Error('API secret not configured');
        }

        const checksum = calculateMD5(`${apiId}${apiSecret}${vin}`);
        const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

        console.log('Making API request to:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorMessage = `API request failed with status: ${response.status}`;
          
          // Update operation log with error
          if (operationLog) {
            await supabase
              .from('seller_operations')
              .update({
                success: false,
                error_message: errorMessage,
                output_data: { status: response.status }
              })
              .eq('id', operationLog.id);
          }

          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        console.log('Raw API response:', responseData);

        // Extract required data
        const { make, model, year } = responseData;
        const valuation = responseData.valuation?.calcValuation?.price;
        const averagePrice = responseData.valuation?.calcValuation?.price_avr || valuation;

        if (!make || !model || !year || (!valuation && !averagePrice)) {
          console.log('Missing required data in API response');
          
          const noDataResponse = {
            success: true,
            data: {
              vin,
              transmission: gearbox,
              noData: true,
              error: 'Could not retrieve complete vehicle information'
            }
          };

          // Store the no-data result
          await supabase
            .from('vin_search_results')
            .insert({
              vin,
              search_data: { noData: true, error: 'Could not retrieve complete vehicle information' },
              success: false
            });

          // Update operation log with no data result
          if (operationLog) {
            await supabase
              .from('seller_operations')
              .update({
                success: true,
                output_data: noDataResponse,
                error_message: 'No data available for VIN'
              })
              .eq('id', operationLog.id);
          }

          return new Response(
            JSON.stringify(noDataResponse),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const validationData = {
          make,
          model,
          year: parseInt(String(year)),
          vin,
          transmission: gearbox,
          valuation,
          averagePrice,
          isExisting: false
        };

        // Cache the validation result
        await supabase
          .from('vin_search_results')
          .insert({
            vin,
            search_data: validationData,
            success: true,
            user_id: userId
          });

        const successResponse = {
          success: true,
          data: validationData
        };

        // Update operation log with success
        if (operationLog) {
          await supabase
            .from('seller_operations')
            .update({
              success: true,
              output_data: successResponse
            })
            .eq('id', operationLog.id);
        }

        console.log('Returning validation data:', validationData);
        return new Response(
          JSON.stringify(successResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid operation');
    }
  } catch (error) {
    console.error('Error in seller operations:', error);
    return new Response(
      JSON.stringify({
        success: false,
        data: {
          error: error.message || 'Failed to process seller operation'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
