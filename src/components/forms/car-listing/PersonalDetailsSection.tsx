
/**
 * Changes made:
 * - Added enhanced validation with inline feedback
 * - Improved required field indicators
 * - Better input focus and blur handling
 * - Added responsive grid layout for desktop/mobile
 * - Optimized input spacing for touch devices
 * - Updated to use FormDataContext instead of requiring form prop
 */

import { FormInput } from "../common/FormInput";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFormData } from "./context/FormDataContext";

export const PersonalDetailsSection = () => {
  const isMobile = useIsMobile();
  const { form } = useFormData();
  
  return (
    <div className={`${isMobile ? 'space-y-6' : 'space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0'}`}>
      <div className={isMobile ? 'mb-2' : ''}>
        <FormInput
          form={form}
          name="name"
          label="Full Name"
          placeholder="Enter your full name"
          required={true}
          autoComplete="name"
        />
      </div>
      
      <div className={isMobile ? 'mb-2' : ''}>
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
      </div>
      
      <div className={`${isMobile ? 'mb-2' : ''} md:col-span-2`}>
        <FormInput
          form={form}
          name="address"
          label="Address"
          placeholder="Enter your address"
          required={true}
          autoComplete="street-address"
        />
      </div>
      
      <div className={isMobile ? 'mb-2' : ''}>
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
    </div>
  );
};
