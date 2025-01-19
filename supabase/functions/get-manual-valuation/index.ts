import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { normalizeData, validateRequest } from "./utils/validation.ts"
import { calculateChecksum } from "./utils/api.ts"

console.log("Manual valuation function started")

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const requestData = await req.json()
    console.log('Received request data:', JSON.stringify(requestData, null, 2))

    const normalizedData = normalizeData(requestData)
    console.log('Normalized data:', JSON.stringify(normalizedData, null, 2))

    const validationResult = validateRequest(normalizedData)
    console.log('Validation result:', JSON.stringify(validationResult, null, 2))

    if (!validationResult.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Validation failed: ${validationResult.errors.join(', ')}`,
          data: null
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Get API credentials from environment
    const apiId = Deno.env.get('CAR_API_ID')
    const apiSecret = Deno.env.get('CAR_API_SECRET')

    if (!apiId || !apiSecret) {
      throw new Error('API credentials not configured')
    }

    // Create a pseudo-VIN for checksum calculation
    const pseudoVin = `${normalizedData.make}${normalizedData.model}${normalizedData.year}`
    const checksum = calculateChecksum(apiId, apiSecret, pseudoVin)
    
    // Build API URL with all required parameters properly encoded
    const params = new URLSearchParams({
      'apiuid': apiId,
      'checksum': checksum,
      'make': encodeURIComponent(normalizedData.make),
      'model': encodeURIComponent(normalizedData.model),
      'year': normalizedData.year.toString(),
      'odometer': normalizedData.mileage.toString(),
      'transmission': normalizedData.transmission,
      'fuel': normalizedData.fuel,
      'country': normalizedData.country,
      'currency': 'PLN',
      'version': '3.0',
      'format': 'json'
    })

    const apiUrl = `https://bp.autoiso.pl/api/v3/getManualValuation?${params.toString()}`

    console.log('Calling external API:', apiUrl)

    const apiResponse = await fetch(apiUrl)
    const apiData = await apiResponse.json()

    console.log('API Response:', JSON.stringify(apiData, null, 2))

    if (!apiResponse.ok || apiData.apiStatus === "ER") {
      const errorMessage = apiData.message || 'Unknown API error'
      console.error('API Error:', errorMessage)
      throw new Error(`API error: ${errorMessage}`)
    }

    // Extract valuation data from API response with proper path and validation
    const valuationData = {
      make: normalizedData.make,
      model: normalizedData.model,
      year: normalizedData.year,
      mileage: normalizedData.mileage,
      transmission: normalizedData.transmission,
      fuel: normalizedData.fuel,
      country: normalizedData.country,
      averagePrice: apiData?.functionResponse?.valuation?.calcValuation?.price_avr || 0,
      minimumPrice: apiData?.functionResponse?.valuation?.calcValuation?.price_min || 0,
      maximumPrice: apiData?.functionResponse?.valuation?.calcValuation?.price_max || 0,
      currency: 'PLN',
      rawResponse: apiData
    }

    console.log('Processed valuation data:', JSON.stringify(valuationData, null, 2))

    return new Response(
      JSON.stringify({
        success: true,
        message: "Valuation completed successfully",
        data: valuationData
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (error) {
    console.error('Error in manual valuation:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        data: null
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})