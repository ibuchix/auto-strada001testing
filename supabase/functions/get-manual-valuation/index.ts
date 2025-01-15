import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { normalizeData, validateRequest } from "./utils/validation.ts"

console.log("Manual valuation function started")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Get the request body
    const requestData = await req.json()
    console.log('Received request data:', JSON.stringify(requestData, null, 2))

    // Normalize and validate the data
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

    // Mock valuation calculation for now
    const valuationAmount = Math.floor(Math.random() * (50000 - 20000) + 20000)

    const response = {
      success: true,
      message: "Valuation completed successfully",
      data: {
        make: normalizedData.make,
        model: normalizedData.model,
        year: normalizedData.year,
        mileage: normalizedData.mileage,
        transmission: normalizedData.transmission,
        valuation: valuationAmount,
        currency: "PLN"
      }
    }

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