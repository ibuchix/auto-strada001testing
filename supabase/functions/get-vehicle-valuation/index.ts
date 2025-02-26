
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface ValuationData {
  make?: string;
  model?: string;
  year?: number;
  price_min?: number;
  price_med?: number;
  valuation?: number;
}

function calculateReservePrice(priceX: number): number {
  // Determine the percentage based on price range
  let percentageY: number;
  
  if (priceX <= 15000) percentageY = 0.65;
  else if (priceX <= 20000) percentageY = 0.46;
  else if (priceX <= 30000) percentageY = 0.37;
  else if (priceX <= 50000) percentageY = 0.27;
  else if (priceX <= 60000) percentageY = 0.27;
  else if (priceX <= 70000) percentageY = 0.22;
  else if (priceX <= 80000) percentageY = 0.23;
  else if (priceX <= 100000) percentageY = 0.24;
  else if (priceX <= 130000) percentageY = 0.20;
  else if (priceX <= 160000) percentageY = 0.185;
  else if (priceX <= 200000) percentageY = 0.22;
  else if (priceX <= 250000) percentageY = 0.17;
  else if (priceX <= 300000) percentageY = 0.18;
  else if (priceX <= 400000) percentageY = 0.18;
  else if (priceX <= 500000) percentageY = 0.16;
  else percentageY = 0.145;

  // Calculate reserve price: PriceX - (PriceX * PercentageY)
  return Math.round(priceX - (priceX * percentageY));
}

function generateMd5(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashArray = Array.from(new Uint8Array(data));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox } = await req.json();
    console.log('Processing valuation request for VIN:', vin, 'Mileage:', mileage);

    // Calculate checksum for API request using simple string concatenation
    const API_ID = 'AUTOSTRA';
    const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    const input = `${API_ID}${API_SECRET}${vin}`;
    const checksum = generateMd5(input);
    
    console.log('Generated checksum:', checksum);

    // Make request to external valuation API
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    console.log('Requesting valuation from:', apiUrl);
    
    const response = await fetch(apiUrl);
    const apiData: ValuationData = await response.json();
    
    console.log('API Response:', apiData);

    if (!apiData.price_min || !apiData.price_med) {
      console.log('No price data available for VIN:', vin);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            vin,
            transmission: gearbox,
            noData: true,
            error: 'No pricing data available for this vehicle'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate base price (PriceX): (price_min + price_med) / 2
    const priceX = Math.round((apiData.price_min + apiData.price_med) / 2);
    console.log('Calculated base price (PriceX):', priceX);

    // Calculate reserve price
    const reservePrice = calculateReservePrice(priceX);
    console.log('Calculated reserve price:', reservePrice);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          make: apiData.make,
          model: apiData.model,
          year: apiData.year,
          vin,
          transmission: gearbox,
          valuation: reservePrice,
          averagePrice: priceX
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing valuation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
