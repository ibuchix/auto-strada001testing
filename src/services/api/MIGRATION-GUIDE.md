
# API Services Migration Guide

This guide provides instructions for migrating from the old consolidated API approach to the new modular architecture.

## Why Migrate?

The new architecture offers:

- Better error handling with specific error types
- Improved offline detection and handling
- Consistent response formats
- Automatic retries for transient failures
- Modular code structure for better maintainability
- Type-safe interfaces throughout the system

## Migration Steps

### 1. Replace Direct Supabase Calls

**Before:**
```typescript
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { 
    someData: 'value'
  }
});

if (error) {
  console.error('Error calling function:', error);
  return null;
}

return data;
```

**After:**
```typescript
import { apiClient } from "@/services/api/apiClientService";

try {
  const { data, error } = await apiClient.invokeFunction('my-function', {
    someData: 'value'
  }, {
    retries: 2,
    errorMessage: 'Failed to process request'
  });
  
  if (error) {
    // Error is already logged and handled by the API client
    return null;
  }
  
  return data;
} catch (e) {
  // This will only catch truly unexpected errors
  console.error('Unexpected error:', e);
  return null;
}
```

### 2. Update React Components

**Before:**
```typescript
const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-data');
      if (error) {
        setError(error);
        return;
      }
      setData(data);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ...
}
```

**After:**
```typescript
import { useInvokeFunctionRequest } from "@/hooks/api";

const MyComponent = () => {
  const { invokeFunction, isLoading, error, data } = useInvokeFunctionRequest();
  
  const fetchData = async () => {
    await invokeFunction('get-data');
  };
  
  // ...
}
```

### 3. Handling Offline States

**Before:**
```typescript
const MyComponent = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // ...
}
```

**After:**
```typescript
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

const MyComponent = () => {
  const { isOffline } = useOfflineStatus({ showToasts: true });
  
  // ...
}
```

### 4. Handling Errors

**Before:**
```typescript
try {
  const { data, error } = await supabase.functions.invoke('my-function');
  if (error) {
    if (error.message.includes('network')) {
      // Handle network error
    } else {
      // Handle other error
    }
  }
} catch (e) {
  // Handle unexpected error
}
```

**After:**
```typescript
import { isNetworkError } from "@/services/api/utils/errorUtils";

try {
  const { data, error } = await apiClient.invokeFunction('my-function');
  if (error) {
    if (isNetworkError(error)) {
      // Handle network error
    } else if (error instanceof ApiError) {
      switch (error.category) {
        case 'authentication':
          // Handle auth error
          break;
        case 'validation':
          // Handle validation error
          break;
        // etc.
      }
    }
  }
} catch (e) {
  // This should rarely happen as most errors are normalized
}
```

## Specific Service Migrations

### Valuation Service

**Before:**
```typescript
import { fetchHomeValuation } from "@/components/hero/valuation/services/api/valuation-api";

const result = await fetchHomeValuation(vin, mileage, gearbox);
```

**After:**
```typescript
import { getVehicleValuation } from "@/services/api/valuationService";

const result = await getVehicleValuation(vin, mileage, gearbox);
```

## Testing Migrated Code

After migration:

1. Test network error handling by turning off your device's internet connection
2. Verify that appropriate error messages are displayed to users
3. Check that automatic retries are working as expected
4. Confirm that response data is properly typed and accessible

## Need Help?

If you encounter issues during migration, check:

1. The error console for detailed error information
2. The API interfaces documentation for correct method signatures
3. The example code in README.md for usage patterns
