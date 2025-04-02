
# Error Handling Architecture

This document describes the error handling architecture used throughout the application, with a focus on API-related errors.

## Overview

The error handling system is designed to provide:

1. Consistent error formatting and typing
2. Automatic categorization of errors
3. Network error detection
4. Integration with the toast notification system

## Error Classes

### ApiError

The base error class for API-related errors, extending the standard JavaScript `Error` class.

```typescript
class ApiError extends Error {
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

#### Usage Example

```typescript
// Creating a new ApiError
const error = new ApiError({
  message: 'Failed to fetch data',
  originalError: originalError,
  statusCode: 500,
  errorCode: 'SERVER_ERROR',
  category: 'server'
});

// Throwing an ApiError
throw new ApiError({
  message: 'Validation failed',
  category: 'validation'
});
```

### Error Categories

Errors are categorized into the following types:

- `network`: Connection issues, timeouts, offline status
- `validation`: Input validation failures
- `authentication`: Auth failures (unauthorized, forbidden)
- `server`: Server-side errors (500 range)
- `unknown`: Errors that don't fit other categories

### Network Error Detection

The `ApiError` class automatically detects network errors through:

1. Analysis of the original error
2. Status code examination
3. Error message pattern matching

## Integration with Error Utils

The `errorUtils.ts` module provides utilities for working with errors:

- `normalizeError()`: Converts any error to a standardized ApiError
- `isNetworkError()`: Determines if an error is related to network connectivity

## Error Factory Functions

For common error types, you can use factory functions:

```typescript
import { 
  createNetworkError, 
  createSubmissionError,
  createValidationError 
} from "@/errors/factory";

// Create a network error
const networkError = createNetworkError(
  'Failed to connect', 
  originalError
);

// Create a validation error
const validationError = createValidationError(
  'Invalid input', 
  { field: 'email', message: 'Must be a valid email' }
);
```

## Error Boundaries

The application uses React Error Boundaries to catch and handle uncaught errors at the component level.

## Toast Integration

Errors can be automatically displayed as toast notifications:

```typescript
import { toast } from "sonner";
import { normalizeError } from "@/services/api/utils/errorUtils";

try {
  // Some operation that might fail
} catch (error) {
  const normalizedError = normalizeError(error);
  toast.error(normalizedError.message);
}
```
