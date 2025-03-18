
/**
 * Changes made:
 * - 2024-08-20: Created reusable form input with validation
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
        <FormItem>
          {label && (
            <FormLabel className="flex items-center">
              {label}
              {required && <span className="text-[#DC143C] ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              placeholder={placeholder}
              type={type}
              className={`border-secondary/20 focus-visible:ring-[#4B4DED] ${className} ${
                isFocused ? "border-[#4B4DED]" : ""
              }`}
              disabled={disabled}
              autoComplete={autoComplete}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                if (onBlur) onBlur();
                field.onBlur();
              }}
              inputMode={inputMode}
              pattern={pattern}
            />
          </FormControl>
          <FormMessage className="text-[#DC143C]" />
        </FormItem>
      )}
    />
  );
};
