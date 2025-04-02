
# API Services Architecture

This documentation provides an overview of the API service architecture used in the Autostrada Seller application.

## Overview

The API services are organized into a layered architecture that provides robust error handling, automatic retries, and consistent response formats. This design improves maintainability and reliability of API interactions throughout the application.

## Core Components

### 1. API Client Service (`apiClientService.ts`)

Central service that provides access to all API functionality with standardized error handling and response formatting.

```typescript
import { apiClient } from "@/services/api/apiClientService";

// Example usage
const response = await apiClient.invokeFunction('get-vehicle-valuation', {
  vin, 
  mileage, 
  gearbox
}, {
  retries: 2,
  timeout: 15000
});
```

### 2. Core API Client (`core/apiClient.ts`)

Implements the core functionality for making requests with built-in retry mechanisms.

### 3. Error Handling (`utils/errorUtils.ts`)

Provides standardized error normalization and detection utilities.

### 4. Request Utilities (`utils/requestUtils.ts`)

Handles the mechanics of making requests with timeouts and configuration.

## Standard Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  data: T | null;    // The response data or null if there was an error
  error: Error | null;  // Error object or null if successful
  status: number;    // HTTP status code or 0 for network errors
}
```

## Configuration Options

API requests can be configured with the following options:

```typescript
interface ApiRequestConfig {
  retries?: number;         // Number of retry attempts (default: 3)
  timeout?: number;         // Request timeout in milliseconds (default: 30000)
  silent?: boolean;         // Whether to suppress error notifications (default: false)
  errorMessage?: string;    // Custom error message to display
  successMessage?: string;  // Success message to display
  headers?: Record<string, string>;  // Additional headers
  idempotencyKey?: string;  // Idempotency key for safe retries
}
```

## Error Handling

Errors are automatically categorized into:

- `network`: Connection issues, timeouts
- `validation`: Input validation errors
- `authentication`: Authentication/authorization failures
- `server`: Server-side errors
- `unknown`: Other errors

Network connectivity issues are automatically detected and handled appropriately.

## Specialized Services

### Valuation Service (`valuationService.ts`)

Provides methods for retrieving vehicle valuations:

- `getVehicleValuation(vin, mileage, gearbox)` - Get general valuation
- `getSellerValuation(vin, mileage, gearbox, userId)` - Get seller-specific valuation with auth

### Car API Service (`carApiService.ts`)

Handles car-related API interactions:

- `fetchCarById(id)` - Fetch a specific car by ID
- `fetchCars()` - Fetch all cars
- `createCarListing(carData)` - Create a new car listing

## React Hooks

For React components, use the provided hooks:

- `useApiRequest()` - General-purpose hook for all request types
- `useGetRequest()`, `usePostRequest()`, etc. - Specialized hooks for specific HTTP methods
- `useInvokeFunctionRequest()` - Hook specifically for Supabase Edge Functions

```typescript
import { useApiRequest } from "@/hooks/api";

function MyComponent() {
  const api = useApiRequest();
  
  const handleSubmit = async (data) => {
    const result = await api.invokeFunction("my-function", data);
    if (result.error) {
      // Handle error
    } else {
      // Use result.data
    }
  };
}
```

## Offline Support

The system includes built-in offline detection through the `useOfflineStatus()` hook and automatically handles offline states with appropriate user feedback.

## Error Types

Custom error types enhance error handling:

- `ApiError` - Base error type with categorization and network detection
