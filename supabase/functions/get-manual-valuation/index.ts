import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { normalizeData, validateRequest } from "./utils/validation.ts"
import { calculateChecksum } from "./utils/api.ts"

console.log("Manual valuation function started")

const API_BASE_URL = "https://bp.autoiso.pl/api/v3/getManualValuation"
const REQUIRED_PARAMS = ['make', 'model', 'year', 'mileage', 'transmission']

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse and log request data
    const requestData = await req.json()
    console.log('Received request data:', JSON.stringify(requestData, null, 2))

    // Validate required fields
    const missingParams = REQUIRED_PARAMS.filter(param => !requestData[param])
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`)
    }

    // Normalize and validate data
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

    // Get API credentials
    const apiId = Deno.env.get('CAR_API_ID')
    const apiSecret = Deno.env.get('CAR_API_SECRET')

    if (!apiId || !apiSecret) {
      throw new Error('API credentials not configured')
    }

    // Calculate checksum using make+model+year as a pseudo VIN
    const pseudoVin = `${normalizedData.make}${normalizedData.model}${normalizedData.year}`
    const checksum = calculateChecksum(apiId, apiSecret, pseudoVin)
    console.log('Using pseudo VIN for checksum:', pseudoVin)
    console.log('Calculated checksum:', checksum)
    
    // Build API URL with properly encoded parameters
    const params = new URLSearchParams({
      'apiuid': apiId,
      'checksum': checksum,
      'make': encodeURIComponent(normalizedData.make),
      'model': encodeURIComponent(normalizedData.model),
      'year': normalizedData.year.toString(),
      'odometer': normalizedData.mileage.toString(),
      'transmission': normalizedData.transmission,
      'fuel': normalizedData.fuel || 'petrol',
      'country': normalizedData.country || 'PL',
      'currency': 'PLN',
      'version': '3.0',
      'format': 'json'
    })

    const apiUrl = `${API_BASE_URL}?${params.toString()}`
    console.log('Calling external API:', apiUrl)

    // Make API request with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const apiResponse = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeout)

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text()
        console.error('API Error Response:', errorText)
        throw new Error(`API responded with status: ${apiResponse.status}`)
      }

      const apiData = await apiResponse.json()
      console.log('API Response:', JSON.stringify(apiData, null, 2))

      if (apiData.apiStatus === "ER") {
        const errorMessage = apiData.message || 'Unknown API error'
        console.error('API Error:', errorMessage)
        throw new Error(`API error: ${errorMessage}`)
      }

      // Extract and transform valuation data
      const valuationData = {
        make: normalizedData.make,
        model: normalizedData.model,
        year: normalizedData.year,
        mileage: normalizedData.mileage,
        transmission: normalizedData.transmission,
        fuel: normalizedData.fuel || 'petrol',
        country: normalizedData.country || 'PL',
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
      if (error.name === 'AbortError') {
        throw new Error('API request timed out')
      }
      throw error
    }

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