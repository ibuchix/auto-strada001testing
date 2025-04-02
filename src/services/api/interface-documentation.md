
# API Interface Documentation

This document provides detailed information about the API interfaces used throughout the application. It serves as a reference for developers working with the API services.

## Core Interfaces

### ApiResponse

The standard response format returned by all API methods.

```typescript
interface ApiResponse<T> {
  data: T | null;     // The response data (null if error)
  error: Error | null;  // Error object (null if success) 
  status: number;     // HTTP status code or 0 for network errors
}
```

### ApiRequestConfig

Configuration options for API requests.

```typescript
interface ApiRequestConfig {
  retries?: number;          // Number of retry attempts (default: 3)
  timeout?: number;          // Request timeout in milliseconds (default: 30000)
  silent?: boolean;          // Suppress error notifications (default: false)
  errorMessage?: string;     // Custom error message to display on failure
  successMessage?: string;   // Success message to display on completion
  headers?: Record<string, string>;  // Additional request headers
  idempotencyKey?: string;   // Key for idempotent operations
}
```

## Error Classes

### ApiError

Base error class for API-related errors.

```typescript
interface CustomErrorInterface extends Error {
  code?: string;
  originalError?: Error | any;
  statusCode?: number;
  errorCode?: string;
  isNetworkError?: boolean;
}

class ApiError extends Error implements CustomErrorInterface {
  public originalError?: Error | any;
  public statusCode?: number;
  public errorCode?: string;
  public isNetworkError: boolean;
  public category: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  
  constructor(params: {
    message: string;
    originalError?: Error | any;
    statusCode?: number;
    errorCode?: string;
    category?: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  });
}
```

## API Client Methods

### HTTP Methods

```typescript
// GET request
get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>

// POST request
post<T>(endpoint: string, data: any, config?: ApiRequestConfig): Promise<ApiResponse<T>>

// PUT request
put<T>(endpoint: string, data: any, config?: ApiRequestConfig): Promise<ApiResponse<T>>

// DELETE request
delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>

// Invoke Supabase Edge Function
invokeFunction<T>(
  functionName: string,
  data: any,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>>
```

## React Hooks

### useApiCore

Base hook providing core API functionality.

```typescript
interface UseApiCoreOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onSettled?: (data: any, error: Error | null) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

function useApiCore(options?: UseApiCoreOptions): {
  isLoading: boolean;
  error: Error | null;
  data: any;
  reset: () => void;
  executeRequest: <T>(
    requestFn: () => Promise<ApiResponse<T>>, 
    config?: ApiRequestConfig
  ) => Promise<T | null>;
}
```

### HTTP Method Hooks

Specialized hooks for specific HTTP methods.

```typescript
function useGetRequest(options?: UseApiCoreOptions): {
  isLoading: boolean;
  error: Error | null;
  data: any;
  reset: () => void;
  get: <T>(endpoint: string, config?: ApiRequestConfig) => Promise<T | null>;
}

function usePostRequest(options?: UseApiCoreOptions): {
  isLoading: boolean;
  error: Error | null;
  data: any;
  reset: () => void;
  post: <T>(endpoint: string, data: any, config?: ApiRequestConfig) => Promise<T | null>;
}

// Similarly for usePutRequest, useDeleteRequest
```

### useInvokeFunctionRequest

Hook specifically for calling Supabase Edge Functions.

```typescript
function useInvokeFunctionRequest(options?: UseApiCoreOptions): {
  isLoading: boolean;
  error: Error | null;
  data: any;
  reset: () => void;
  invokeFunction: <T>(
    functionName: string, 
    data: any, 
    config?: ApiRequestConfig
  ) => Promise<T | null>;
}
```

### useApiRequest

Combined hook providing all API methods.

```typescript
function useApiRequest(options?: UseApiCoreOptions): {
  isLoading: boolean;
  error: Error | null;
  data: any;
  reset: () => void;
  get: <T>(endpoint: string, config?: ApiRequestConfig) => Promise<T | null>;
  post: <T>(endpoint: string, data: any, config?: ApiRequestConfig) => Promise<T | null>;
  put: <T>(endpoint: string, data: any, config?: ApiRequestConfig) => Promise<T | null>;
  delete: <T>(endpoint: string, config?: ApiRequestConfig) => Promise<T | null>;
  invokeFunction: <T>(
    functionName: string, 
    data: any, 
    config?: ApiRequestConfig
  ) => Promise<T | null>;
}
```

### useOfflineStatus

Hook for detecting offline status.

```typescript
interface UseOfflineStatusOptions {
  showToasts?: boolean;
}

function useOfflineStatus(options?: UseOfflineStatusOptions): {
  isOffline: boolean;
}
```

## Valuation Service Interfaces

### ValuationResponse

```typescript
interface ValuationResponse {
  data?: {
    make?: string;
    model?: string;
    year?: number;
    valuation?: number;
    averagePrice?: number;
    reservePrice?: number;
    isExisting?: boolean;
    reservationId?: string;
    [key: string]: any;
  };
  error?: Error;
}
```

### VIN Validation

```typescript
interface VinValidationRequest {
  vin: string;
  mileage: number;
  userId?: string;
}

interface VinValidationResponse {
  success: boolean;
  data?: {
    isValid?: boolean;
    vehicleExists?: boolean;
    reservationExists?: boolean;
    requiresValuation?: boolean;
    cached?: boolean;
    vin: string;
    mileage: number;
    make?: string;
    model?: string;
    year?: number;
    reservationId?: string;
    valuationData?: any;
  };
  error?: string;
  errorCode?: string;
}
```

## VIN Reservation Service Interfaces

```typescript
interface VinReservationResult {
  success: boolean;
  data?: {
    reservationId?: string;
    expiresAt?: string;
    isNew?: boolean;
    exists?: boolean;
    wasExpired?: boolean;
    message?: string;
    reservation?: {
      id: string;
      vin: string;
      expiresAt: string;
      valuationData?: any;
      timeRemaining: number;
    };
  };
  error?: string;
}
```
