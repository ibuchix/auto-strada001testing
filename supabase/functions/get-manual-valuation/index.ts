import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { normalizeData, validateRequest } from "./utils/validation.ts"

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

    // Mock valuation calculation with price ranges
    const baseValue = Math.floor(Math.random() * (50000 - 20000) + 20000)
    const priceRanges = {
      minimumPrice: Math.floor(baseValue * 0.8),
      maximumPrice: Math.floor(baseValue * 1.2),
      averagePrice: baseValue
    }

    console.log('Calculated price ranges:', {
      ...priceRanges,
      currency: normalizedData.country === 'PL' ? 'PLN' : 'EUR'
    })

    const response = {
      success: true,
      message: "Valuation completed successfully",
      data: {
        make: normalizedData.make,
        model: normalizedData.model,
        year: normalizedData.year,
        mileage: normalizedData.mileage,
        transmission: normalizedData.transmission,
        fuel: normalizedData.fuel,
        country: normalizedData.country,
        ...priceRanges,
        currency: normalizedData.country === 'PL' ? 'PLN' : 'EUR'
      }
    }

    console.log('Final response:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
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