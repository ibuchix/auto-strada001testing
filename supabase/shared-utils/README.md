
# Auto-Strada Shared Utilities

This directory contains shared utility functions and types that can be imported across edge functions.

## Usage

Import utilities using the `mod.ts` entry point:

```typescript
import { corsHeaders, calculateMd5, logOperation } from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";
```

Or import individual utilities directly:

```typescript
import { corsHeaders } from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/cors.ts";
import { logOperation } from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/logging.ts";
```

## Available Utilities

### Core Utilities
- `cors.ts` - CORS headers and preflight handling
- `logging.ts` - Structured logging functions
- `response.ts` - Response formatting utilities
- `validation.ts` - Input validation helpers

### Data Handling
- `cache.ts` - In-memory caching utilities
- `checksum.ts` - Checksum calculation functions

### Types and Validation
- `types.ts` - Shared type definitions
- `request-validator.ts` - Request validation using Zod schemas

## Example Usage

```typescript
import { corsHeaders, logOperation, formatSuccessResponse } from "https://raw.githubusercontent.com/ibuchix/auto-strada001testing/main/supabase/shared-utils/mod.ts";

// Handle CORS preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// Log operations
logOperation('process_request', { requestId: '123' });

// Format response
return formatSuccessResponse({ data: result });
```

## Adding New Utilities

When adding new utilities:
1. Create the utility file in `shared-utils/`
2. Add its export to `mod.ts`
3. Document the utility in this README
4. Update any edge functions to use the shared version

