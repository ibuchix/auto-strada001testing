
# FormDataProvider Usage Guide

The `FormDataProvider` pattern simplifies form state management across components by using React Context. It eliminates prop drilling and ensures type safety throughout the component tree.

## Basic Setup

Wrap your form components with the provider:

```tsx
<FormDataProvider form={formInstance}>
  {/* Your form components */}
</FormDataProvider>
```

## Accessing Form Methods

Access the form in components:

```tsx
// Get all form methods
const { control, handleSubmit, watch, setValue, getValues, reset } = useFormData();

// Use form methods as needed
const onSubmit = (data) => console.log(data);
```

For components that only need specific form methods:

```tsx
// Only get what you need
const { watch } = useFormData();
const formValues = watch();
```

## Benefits

This implementation ensures:

1. Strict type checking throughout the component tree
2. Optimal performance with memoization
3. Clear error messages for dev experience
4. Better React DevTools visibility with display name
5. Proper separation of concerns

## Example Component

```tsx
import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const SimpleFormField = () => {
  // Access form methods directly
  const { control } = useFormData();
  
  return (
    <FormField
      control={control}
      name="name"
      rules={{ required: "Name is required" }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Your name" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
```

## Advanced Usage

For complex forms with multiple sections, you can create section-specific hooks that use `useFormData` internally:

```tsx
// useVehicleFormSection.ts
export const useVehicleFormSection = () => {
  const form = useFormData();
  
  // Add section-specific logic here
  const resetVehicleFields = () => {
    form.setValue('make', '');
    form.setValue('model', '');
    form.setValue('year', new Date().getFullYear());
  };
  
  return {
    ...form,
    resetVehicleFields
  };
};
```
