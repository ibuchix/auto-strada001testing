
# Utils Directory

This directory contains utility functions and helpers used throughout the application.

## Timeout Utilities (`timeoutUtils.ts`)

A set of standardized utilities for managing timeouts consistently across the application.

### Standardized Durations

The `TimeoutDurations` constant provides standardized timeout durations:

```typescript
SHORT: 3000,       // 3 seconds - for quick operations, toasts
STANDARD: 5000,    // 5 seconds - default duration for most operations
MEDIUM: 10000,     // 10 seconds - for moderate operations like data fetching
LONG: 20000,       // 20 seconds - for longer operations like uploads
EXTENDED: 30000,   // 30 seconds - for complex operations like submissions
CRITICAL: 60000    // 60 seconds - for critical operations that must complete
```

### Core Utilities

1. `createTimeout`: Creates a managed timeout with built-in cleanup
2. `withTimeout`: Wraps a promise with a timeout (race condition)
3. `useTimeoutManager`: React hook for managing multiple timeouts
4. `delay`: Creates a promise that resolves after specified duration

### Usage Examples

**Basic Timeout with Cleanup:**
```typescript
const { clear, promise } = createTimeout(() => {
  console.log('Timeout completed');
}, TimeoutDurations.SHORT);

// To cancel the timeout:
clear();

// To wait for completion:
await promise;
```

**Promise with Timeout:**
```typescript
try {
  const result = await withTimeout(
    fetchData(),
    TimeoutDurations.MEDIUM,
    "Data fetching timed out"
  );
  handleSuccess(result);
} catch (error) {
  handleError(error);
}
```

**React Component Timeouts:**
```typescript
import { useTimeout, useInterval, useDebounce } from '@/hooks/useTimeout';

function MyComponent() {
  // Managed timeout
  const { start, stop, reset } = useTimeout(() => {
    console.log('Timeout completed');
  }, TimeoutDurations.STANDARD);
  
  // Debounced input handler
  const debouncedSearch = useDebounce((query) => {
    console.log('Searching for:', query);
  }, 500);
  
  // Interval
  const { start: startInterval, stop: stopInterval } = useInterval(() => {
    console.log('Interval tick');
  }, 1000, true); // Execute immediately on start
  
  // All timeouts/intervals are automatically cleared on component unmount
}
```

## Best Practices

1. Always use `TimeoutDurations` constants for consistency
2. Always ensure timeouts are properly cleaned up to prevent memory leaks
3. For React components, prefer the hook-based timeout utilities
4. Use appropriate timeout durations based on expected operation time
5. Always handle timeout errors gracefully with user feedback

