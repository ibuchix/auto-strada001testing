
/**
 * Changes made:
 * - Enhanced input styles with better visual feedback
 * - Added proper focus and error states
 * - Improved required field indicators with asterisk (*)
 * - Better label/input spacing and sizing
 * - Fixed input event handling to ensure values are properly updated in form state
 * - Fixed TypeScript error by properly accessing fieldState in render
 * - Added inline validation feedback with immediate error messages
 * - Optimized for mobile/touch with larger hit areas and better spacing
 */

import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  immediateValidation?: boolean;
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
  validate,
  immediateValidation = true
}: FormInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isMobile = useIsMobile();
  
  // Force validation if the field is required and was touched
  useEffect(() => {
    if (touched && required && immediateValidation) {
      const value = form.getValues(name);
      if (!value) {
        form.trigger(name);
      }
    }
  }, [touched, name, form, required, immediateValidation]);

  return (
    <FormField
      control={form.control}
      name={name}
      rules={{
        required: required ? `${label || name} is required` : false,
        validate: validate
      }}
      render={({ field, fieldState }) => {
        const hasError = !!fieldState.error;
        const showError = hasError && (touched || fieldState.isTouched);
        
        return (
          <FormItem className={`space-y-2 mb-5 ${isMobile ? 'mb-6' : ''}`}>
            {label && (
              <FormLabel className={`flex items-start text-base font-medium text-body ${isMobile ? 'text-base mb-1' : ''}`}>
                <span>{label}</span>
                {required && <span className="text-[#DC143C] ml-1 font-bold">*</span>}
              </FormLabel>
            )}
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  placeholder={placeholder}
                  type={type}
                  id={name}
                  className={`
                    ${isMobile ? 'h-14 text-base px-4' : 'h-12 px-4 text-base'} 
                    border rounded-md transition-colors
                    ${field.value ? 'border-gray-400' : ''}
                    ${showError 
                      ? "border-[#DC143C] focus-visible:ring-[#DC143C]/20 pr-10" 
                      : isFocused 
                        ? "border-[#4B4DED] focus-visible:ring-[#4B4DED]/20" 
                        : "border-gray-300"}
                    ${className}`}
                  disabled={disabled}
                  autoComplete={autoComplete}
                  // Ensure we properly handle focus and blur events
                  onFocus={() => {
                    setIsFocused(true);
                  }}
                  onBlur={(e) => {
                    setIsFocused(false);
                    setTouched(true);
                    // Call the field's onBlur to notify React Hook Form
                    field.onBlur();
                    // Call additional onBlur if provided
                    if (onBlur) onBlur();
                    
                    // Validate on blur for immediate feedback
                    if (immediateValidation) {
                      form.trigger(name);
                    }
                  }}
                  // Ensure we're properly handling input changes
                  onChange={(e) => {
                    field.onChange(e);
                    // Validate on change if already touched
                    if (touched && immediateValidation) {
                      form.trigger(name);
                    }
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
              {showError && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-[#DC143C] ${isMobile ? 'right-4' : ''}`}>
                  <AlertCircle className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                </div>
              )}
            </div>
            {showError && (
              <div className={`text-[#DC143C] ${isMobile ? 'text-sm mt-2' : 'text-sm'} font-medium flex items-start gap-1 mt-1`}>
                <FormMessage />
              </div>
            )}
          </FormItem>
        );
      }}
    />
  );
};
