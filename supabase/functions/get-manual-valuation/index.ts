import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { normalizeData, validateRequest } from "./utils/validation.ts"
import { calculateChecksum } from "./utils/api.ts"

console.log("Manual valuation function started")

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    })
  }

  try {
    // Parse and log request data
    const requestData = await req.json()
    console.log('Received request data:', JSON.stringify(requestData, null, 2))

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

    // Generate checksum using concatenated string of all required fields
    const checksumInput = `${normalizedData.make}${normalizedData.model}${normalizedData.year}${normalizedData.mileage}${normalizedData.transmission}${normalizedData.fuel}${normalizedData.country}`
    const checksum = calculateChecksum(apiId, apiSecret, checksumInput)
    console.log('Using checksum input:', checksumInput)
    console.log('Calculated checksum:', checksum)

    // Build API URL with properly encoded parameters
    const baseUrl = "https://bp.autoiso.pl/api/v3/getManualValuation"
    const queryParams = new URLSearchParams()
    
    // Required parameters exactly as expected by the API
    queryParams.set('apiuid', apiId)
    queryParams.set('checksum', checksum)
    queryParams.set('make', normalizedData.make.trim().toUpperCase())
    queryParams.set('model', normalizedData.model.trim().toUpperCase())
    queryParams.set('year', String(normalizedData.year))
    queryParams.set('mileage', String(normalizedData.mileage))
    queryParams.set('transmission', normalizedData.transmission.toLowerCase())
    queryParams.set('fuel', normalizedData.fuel.toLowerCase())
    queryParams.set('country', normalizedData.country.toUpperCase())
    queryParams.set('currency', 'PLN')
    queryParams.set('version', '3.0')
    queryParams.set('format', 'json')
    
    // Add capacity if provided
    if (normalizedData.capacity) {
      queryParams.set('capacity', String(normalizedData.capacity))
    }

    const apiUrl = `${baseUrl}?${queryParams.toString()}`
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
        fuel: normalizedData.fuel,
        country: normalizedData.country,
        capacity: normalizedData.capacity || null,
        valuation: apiData?.functionResponse?.valuation?.calcValuation?.price || 0,
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