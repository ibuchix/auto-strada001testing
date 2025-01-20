import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { calculateChecksum } from './utils/api.ts'
import { validateManualValuationInput } from './utils/validation.ts'

const API_ID = Deno.env.get('CAR_API_ID') || ''
const API_SECRET = Deno.env.get('CAR_API_SECRET') || ''

console.log("Manual valuation function loaded")

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const input = await req.json()
    console.log('Received input:', input)

    // Validate input
    const validationResult = validateManualValuationInput(input)
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.errors)
      return new Response(
        JSON.stringify({
          success: false,
          message: `Validation failed: ${validationResult.errors.join(', ')}`,
          data: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Extract validated data
    const {
      make,
      model,
      year,
      mileage,
      transmission,
      fuel,
      country,
      capacity
    } = input

    // Calculate checksum
    const checksumValue = make + model + year.toString()
    const checksum = calculateChecksum(API_ID, API_SECRET, checksumValue)
    console.log('Calculated checksum:', checksum, 'from value:', checksumValue)

    // Construct API URL with all required parameters
    const baseUrl = 'https://bp.autoiso.pl/api/v3/getManualValuation'
    const queryParams = new URLSearchParams({
      apiuid: API_ID,
      checksum: checksum,
      make: make,
      model: model,
      year: year.toString(),
      mileage: mileage.toString(),
      transmission: transmission,
      fuel: fuel,
      country: country,
      ...(capacity && { capacity: capacity.toString() })
    })

    const apiUrl = `${baseUrl}?${queryParams.toString()}`
    console.log('Calling API URL:', apiUrl)

    // Make API request
    const response = await fetch(apiUrl)
    const data = await response.json()

    console.log('API Response:', data)

    if (!response.ok) {
      throw new Error(`API error: ${data.message || 'Unknown error'}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valuation retrieved successfully',
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in manual valuation:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error: ${error.message}`,
        data: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})