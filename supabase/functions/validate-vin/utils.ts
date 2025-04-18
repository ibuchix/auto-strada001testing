
/**
 * Utilities for VIN validation
 * Created: 2025-04-19 - Inlined utilities to avoid shared imports
 */

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Shared error types to ensure consistent error handling
export class ApiError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

// Format API responses consistently
export function formatResponse(
  body: Record<string, any>,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers = {} } = options;
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
  });
}

// Simple caching utilities
const cache = new Map<string, { data: any; timestamp: number }>();

export function getCachedValidation(vin: string, mileage: number): any {
  const key = `${vin}_${mileage}`;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
    return cached.data;
  }
  
  return null;
}

export function setCachedValidation(vin: string, mileage: number, data: any): void {
  const key = `${vin}_${mileage}`;
  cache.set(key, { data, timestamp: Date.now() });
}

// Rate limiting utility
const rateLimits = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number = 5, window: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(key) || [];
  
  // Filter out old timestamps
  const recent = timestamps.filter(time => now - time < window);
  
  // Check if limit exceeded
  if (recent.length >= limit) {
    return true; // Rate limit exceeded
  }
  
  // Update timestamps
  recent.push(now);
  rateLimits.set(key, recent);
  
  return false; // Rate limit not exceeded
}

// Create Supabase client for database operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export function createClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return createClient(supabaseUrl, supabaseKey);
}
