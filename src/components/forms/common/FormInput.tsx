
/**
 * Changes made:
 * - Enhanced input styles with better visual feedback
 * - Added proper focus and error states
 * - Improved required field indicators
 * - Better label/input spacing and sizing
 * - Fixed input event handling to ensure values are properly updated in form state
 */

import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";

interface FormInputProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  onBlur?: () => void;
  inputMode?: "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  pattern?: string;
  validate?: (value: string) => boolean | string;
}

export const FormInput = ({
  form,
  name,
  label,
  placeholder,
  required = false,
  type = "text",
  className = "",
  disabled = false,
  autoComplete,
  onBlur,
  inputMode,
  pattern,
  validate
}: FormInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      rules={{
        required: required ? `${label || name} is required` : false,
        validate: validate
      }}
      render={({ field }) => (
        <FormItem className="space-y-2 mb-4">
          {label && (
            <FormLabel className="flex items-center text-base font-medium text-body">
              {label}
              {required && <span className="text-[#DC143C] ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              placeholder={placeholder}
              type={type}
              className={`h-12 px-4 text-base border rounded-md 
                ${field.value ? 'border-gray-400' : ''}
                ${fieldState.invalid ? "border-[#DC143C] focus-visible:ring-[#DC143C]/10" : 
                isFocused ? "border-[#4B4DED] focus-visible:ring-[#4B4DED]/10" : 
                "border-gray-300"}
                ${className}`}
              disabled={disabled}
              autoComplete={autoComplete}
              // Ensure we properly handle focus and blur events
              onFocus={() => {
                setIsFocused(true);
                console.log(`Field ${name} focused`);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                // Call the field's onBlur to notify React Hook Form
                field.onBlur();
                // Call additional onBlur if provided
                if (onBlur) onBlur();
                console.log(`Field ${name} blurred with value: ${e.target.value}`);
              }}
              // Ensure we're properly handling input changes
              onChange={(e) => {
                field.onChange(e);
                console.log(`Field ${name} changed to: ${e.target.value}`);
              }}
              inputMode={inputMode}
              pattern={pattern}
              // Add key event handling
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission on Enter
                }
              }}
            />
          </FormControl>
          <FormMessage className="text-[#DC143C] text-sm font-medium" />
        </FormItem>
      )}
    />
  );
};
