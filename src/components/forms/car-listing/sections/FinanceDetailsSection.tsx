
/**
 * Finance Details Section 
 * Created: 2025-05-04
 * Updated: 2025-05-04 - Fixed financeAmount type handling to consistently use number type
 * 
 * Section for handling vehicle finance information with proper data validation
 * and conditional rendering based on whether the vehicle has outstanding finance.
 */

import { FormSection } from "../FormSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useFormData } from "../context/FormDataContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";

export const FinanceDetailsSection = () => {
  const { form } = useFormData();
  const [showFinanceFields, setShowFinanceFields] = useState(false);
  
  // Common finance providers in Poland
  const financeProviders = [
    "PKO Bank Polski",
    "Santander Bank Polska",
    "mBank",
    "ING Bank Śląski",
    "BNP Paribas",
    "Alior Bank",
    "Bank Millennium",
    "Credit Agricole",
    "Toyota Bank",
    "Volkswagen Bank",
    "Other"
  ];
  
  // Watch for changes in the hasOutstandingFinance field
  const hasOutstandingFinance = form.watch("hasOutstandingFinance");
  
  // Update visibility when hasOutstandingFinance changes
  useEffect(() => {
    setShowFinanceFields(!!hasOutstandingFinance);
  }, [hasOutstandingFinance]);
  
  return (
    <FormSection title="Finance Details">
      <CardHeader>
        <CardTitle>Finance Details</CardTitle>
        <CardDescription>
          Information about any outstanding finance on your vehicle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Outstanding Finance Checkbox */}
        <Controller
          name="hasOutstandingFinance"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    // Reset the finance amount when unchecking
                    if (!checked) {
                      form.setValue("financeAmount", null);
                      form.setValue("financeProvider", "");
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Does your vehicle have outstanding finance?
                </FormLabel>
                <FormDescription>
                  This helps us prepare the necessary paperwork for the sale
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {/* Only show these fields if hasOutstandingFinance is true */}
        {showFinanceFields && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Finance Amount */}
              <Controller
                control={form.control}
                name="financeAmount"
                rules={{
                  required: hasOutstandingFinance ? "Finance amount is required" : false,
                  validate: (value) => {
                    if (hasOutstandingFinance) {
                      if (!value && value !== 0) return "Finance amount is required";
                      if (Number(value) <= 0) return "Amount must be greater than zero";
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outstanding Finance Amount (PLN)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 15000"
                        type="number"
                        inputMode="decimal"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value ? Number(value) : null;
                          field.onChange(numValue);
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the outstanding amount owed on your vehicle
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Finance Provider */}
              <Controller
                control={form.control}
                name="financeProvider"
                rules={{
                  required: hasOutstandingFinance ? "Finance provider is required" : false
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finance Provider</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        disabled={!hasOutstandingFinance}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select finance provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {financeProviders.map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              {provider}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      The bank or finance company that provided the loan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="p-4 border rounded-md border-blue-200 bg-blue-50">
              <p className="text-sm text-blue-800">
                Providing accurate finance information ensures a smoother selling process. 
                We'll work with your finance provider to facilitate the sale.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </FormSection>
  );
};
