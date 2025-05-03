
/**
 * PersonalDetailsSection Component
 * Displays and handles seller's personal details
 * Updated: 2025-05-03 - Fixed TypeScript errors related to form value types
 * Updated: 2025-05-04 - Added sellerDetails type to CarListingFormData and fixed field paths
 */

import { useFormData } from "../context/FormDataContext";
import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export const PersonalDetailsSection = () => {
  const { form } = useFormData();
  const [showBankDetails, setShowBankDetails] = useState(false);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Seller Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="seller_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <h3 className="text-lg font-semibold pt-4">Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="isSellingOnBehalf"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                I am selling this vehicle on behalf of someone else
              </FormLabel>
              <p className="text-sm text-gray-500">
                Check this if you're not the registered owner of the vehicle
              </p>
            </div>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="hasOutstandingFinance"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (!checked) {
                    // Reset finance fields if unchecked
                    form.setValue('financeAmount', undefined);
                    form.setValue('financeProvider', '');
                    form.setValue('financeEndDate', '');
                  }
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                This vehicle has outstanding finance
              </FormLabel>
              <p className="text-sm text-gray-500">
                If the vehicle is on finance, please provide details
              </p>
            </div>
          </FormItem>
        )}
      />
      
      {/* Only show finance details if hasOutstandingFinance is checked */}
      {form.watch('hasOutstandingFinance') && (
        <div className="space-y-4 pl-8 border-l-2 border-gray-200">
          <FormField
            control={form.control}
            name="financeProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finance Provider</FormLabel>
                <FormControl>
                  <Input placeholder="Bank or finance company" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="financeAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outstanding Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="financeEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};
