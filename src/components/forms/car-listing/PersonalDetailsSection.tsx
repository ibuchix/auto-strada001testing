
/**
 * Changes made:
 * - Added enhanced validation with inline feedback
 * - Improved required field indicators
 * - Better input focus and blur handling
 */

import { FormInput } from "../common/FormInput";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface PersonalDetailsSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const PersonalDetailsSection = ({ form }: PersonalDetailsSectionProps) => {
  return (
    <div className="space-y-6">
      <FormInput
        form={form}
        name="name"
        label="Full Name"
        placeholder="Enter your full name"
        required={true}
        autoComplete="name"
      />
      
      <FormInput
        form={form}
        name="address"
        label="Address"
        placeholder="Enter your address"
        required={true}
        autoComplete="street-address"
      />
      
      <FormInput
        form={form}
        name="mobileNumber"
        label="Mobile Number"
        placeholder="Enter your mobile number"
        required={true}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        validate={(value) => {
          return /^\+?[0-9\s\-()]{8,}$/.test(value) || 
            "Please enter a valid mobile number";
        }}
      />
      
      <FormInput
        form={form}
        name="contactEmail"
        label="Email Address"
        placeholder="Enter your email address"
        required={false}
        type="email"
        autoComplete="email"
        inputMode="email"
        validate={(value) => {
          if (!value) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 
            "Please enter a valid email address";
        }}
      />
    </div>
  );
};
