
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createErrorResponse, createSuccessResponse } from "./validation.ts";

const mockSupabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.test("createErrorResponse returns correct error structure", () => {
  const vin = "TEST12345678901234";
  const gearbox = "manual";
  const errorMessage = "Test error message";
  
  const response = createErrorResponse(vin, gearbox, errorMessage);
  
  assertEquals(response.success, false);
  assertEquals(response.data.vin, vin);
  assertEquals(response.data.transmission, gearbox);
  assertEquals(response.data.error, errorMessage);
});

Deno.test("createSuccessResponse returns correct success structure", () => {
  const testData = {
    make: "Test Make",
    model: "Test Model",
    year: 2020,
    vin: "TEST12345678901234",
    transmission: "manual",
    valuation: 10000
  };
  
  const response = createSuccessResponse(testData);
  
  assertEquals(response.success, true);
  assertEquals(response.data, testData);
});
