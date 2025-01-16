import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateChecksum } from "./utils/checksum.ts";
import { extractPrice } from "./utils/priceExtractor.ts";

const API_ID = 'AUTOSTRA';
const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';

serve(async (req) => {
  console.log('Request received:', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Parsed request body:', parsedBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { vin, mileage, gearbox } = parsedBody;
    
    // Input validation
    if (!vin || typeof vin !== 'string' || vin.length < 11) {
      throw new Error('Invalid VIN format');
    }

    if (!mileage || isNaN(mileage) || mileage < 0) {
      throw new Error('Invalid mileage value');
    }

    console.log('Processing VIN valuation request:', {
      vin,
      mileage,
      gearbox,
      timestamp: new Date().toISOString()
    });

    const checksum = calculateChecksum(API_ID, API_SECRET, vin);
    console.log('Calculated checksum:', checksum);

    // Updated API URL to include transmission parameter
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/transmission:${gearbox || 'manual'}/currency:PLN`;
    console.log('Calling API:', apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('API Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Parsed API Response:', JSON.stringify(responseData, null, 2));
        
        // Enhanced logging for price data
        console.log('Price Data Analysis:', {
          directPrice: responseData.price,
          valuationPrice: responseData.valuation?.price,
          estimatedValue: responseData.estimated_value,
          averagePrice: responseData.average_price,
          allPriceFields: Object.keys(responseData).filter(key => 
            typeof key === 'string' && 
            key.toLowerCase().includes('price')
          ),
          nestedPrices: JSON.stringify(
            Object.entries(responseData)
              .filter(([_, value]) => 
                value && typeof value === 'object' && 
                Object.keys(value).some(k => k.toLowerCase().includes('price'))
              )
          )
        });
        
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid JSON response from API');
      }

      // Extract and transform the valuation data with enhanced validation
      const valuationData = {
        make: responseData.make || responseData.functionResponse?.make || responseData.vehicle?.make || 'Unknown',
        model: responseData.model || responseData.functionResponse?.model || responseData.vehicle?.model || 'Unknown',
        year: responseData.year || responseData.functionResponse?.year || responseData.vehicle?.year || new Date().getFullYear(),
        vin: vin,
        mileage: mileage,
        transmission: gearbox || 'manual',
        valuation: extractPrice(responseData),
        averagePrice: responseData.average_price || responseData.price || responseData.estimated_value,
        currency: "PLN"
      };

      console.log('Final transformed valuation data:', valuationData);

      if (!valuationData.valuation && !valuationData.averagePrice) {
        console.warn('No price data found in API response');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Valuation completed successfully',
          data: valuationData
        }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('API request timed out after 30 seconds');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to get valuation',
        error: error.message,
        timestamp: new Date().toISOString(),
        data: null
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});