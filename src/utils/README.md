
# Utility Functions

This document provides an overview of the utility functions available in the application.

## API Utilities

### Error Utilities (`errorUtils.ts`)

Functions for handling API errors consistently:

#### `normalizeError<T>(error: any, config: ApiRequestConfig): ApiResponse<T>`

Normalizes any error into a consistent `ApiResponse` format.

```typescript
import { normalizeError } from "@/services/api/utils/errorUtils";

try {
  // API call
} catch (error) {
  return normalizeError(error, { silent: true });
}
```

#### `isNetworkError(error: any): boolean`

Determines if an error is related to network connectivity.

```typescript
import { isNetworkError } from "@/services/api/utils/errorUtils";

if (isNetworkError(error)) {
  // Handle offline scenario
}
```

### Request Utilities (`requestUtils.ts`)

Functions for making API requests:

#### `makeRequest<T>(requestFn: () => Promise<T>, config: ApiRequestConfig): Promise<T>`

Makes an API request with standardized error handling.

## Type Guards

### `isCarEntity(obj: any): obj is CarEntity`

Type guard to ensure an object conforms to the `CarEntity` interface.

```typescript
import { isCarEntity } from "@/utils/typeGuards";

if (isCarEntity(data)) {
  // It's safe to use data.make, data.model, etc.
}
```

### `isCarEntityArray(obj: any): obj is CarEntity[]`

Type guard to ensure an object is an array of `CarEntity` objects.

## Offline Status Hook

### `useOfflineStatus(options?: UseOfflineStatusOptions)`

Hook for detecting offline status with optional toast notifications.

```typescript
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

function MyComponent() {
  const { isOffline } = useOfflineStatus({ showToasts: true });
  
  if (isOffline) {
    return <OfflineIndicator />;
  }
  
  // Regular component rendering
}
```

Options:
- `showToasts`: Whether to show toast notifications when online/offline status changes

## API Request Hooks

### `useApiRequest(options?: UseApiCoreOptions)`

Hook providing all API methods in one place.

```typescript
import { useApiRequest } from "@/hooks/api";

function MyComponent() {
  const api = useApiRequest({
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error)
  });
  
  const handleClick = async () => {
    await api.invokeFunction('my-function', { data: 'value' });
    // No need to check for errors - handled by onError callback
  };
}
```

Options:
- `onSuccess`: Callback for successful requests
- `onError`: Callback for failed requests
- `onSettled`: Callback that runs after request completes (success or failure)
- `showSuccessToast`: Whether to show success toast notifications
- `showErrorToast`: Whether to show error toast notifications

## Valuation Service

### `getVehicleValuation(vin, mileage, gearbox)`

Get vehicle valuation data.

```typescript
import { getVehicleValuation } from "@/services/api/valuationService";

const { data, error } = await getVehicleValuation('WVWZZZ1KZAM082351', 80000, 'manual');
```

### `getSellerValuation(vin, mileage, gearbox, userId)`

Get seller-specific valuation with authentication.

```typescript
import { getSellerValuation } from "@/services/api/valuationService";

const { data, error } = await getSellerValuation('WVWZZZ1KZAM082351', 80000, 'manual', userId);
```
