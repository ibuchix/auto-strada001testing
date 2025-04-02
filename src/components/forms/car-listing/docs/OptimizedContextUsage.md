
# Optimized FormDataContext Usage Guide

## Basic Usage

```tsx
import { useFormData, useFormValues, useFormState } from "../context/FormDataContext";

// Component that needs full form access
const FormEditor = () => {
  const { form } = useFormData();
  
  return (
    <div>
      <button onClick={() => form.reset()}>Reset Form</button>
    </div>
  );
};

// Component that only needs to read values (won't rerender on other form changes)
const DisplayVehicleInfo = () => {
  // Only rerenders when make or model changes
  const make = useFormValues("make");
  const model = useFormValues("model");
  
  return (
    <div>
      <h3>Vehicle: {make} {model}</h3>
    </div>
  );
};

// Component that only needs form state (won't rerender on value changes)
const FormStatusBar = () => {
  const { isDirty, isValid, isSubmitting } = useFormState();
  
  return (
    <div className="status-bar">
      {isDirty && <span>Unsaved changes</span>}
      {!isValid && <span>Form has errors</span>}
      {isSubmitting && <span>Submitting...</span>}
    </div>
  );
};
```

## Performance Benefits

This implementation offers several advantages:

1. **Selective Rerenders**: Components only subscribe to the parts of the form they need
2. **Stable Function References**: All functions are memoized to prevent unnecessary rerenders
3. **Context Segmentation**: Multiple hooks to access different aspects of the form
4. **DevTools Support**: Named context for better debugging experience
5. **Type Safety**: Full TypeScript support with helpful error messages

## When to Use Each Hook

- `useFormData()` - When you need direct form control (submit, reset, etc.)
- `useFormValues()` - When you only need to read form values
- `useFormState()` - When you only need to check form state (valid/dirty/errors)
