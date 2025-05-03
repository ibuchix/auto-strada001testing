
/**
 * Changes made:
 * - 2024-06-10: Created new component for finance details
 * - This component is conditionally shown based on vehicle having outstanding finance
 * - Fixed FormSection usage by adding required title prop
 * - Updated to use FormDataContext instead of requiring form prop
 * - 2025-07-22: Fixed type errors with form field names
 * - 2025-07-25: Fixed issues with field types by using Controller
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSection } from "./FormSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useFormData } from "./context/FormDataContext";
import { Controller } from "react-hook-form";

interface FinanceDetailsSectionProps {
  carId?: string;
}

export const FinanceDetailsSection = ({ carId }: FinanceDetailsSectionProps) => {
  const { form } = useFormData();
  const [showFinanceFields, setShowFinanceFields] = useState(false);
  
  // Use watch to track hasOutstandingFinance field
  const hasOutstandingFinance = form.watch("hasOutstandingFinance");

  // Update visibility when hasOutstandingFinance changes
  useEffect(() => {
    setShowFinanceFields(Boolean(hasOutstandingFinance));
  }, [hasOutstandingFinance]);

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

  if (!showFinanceFields) {
    return (
      <FormSection title="Finance Details">
        <CardHeader>
          <CardTitle>Finance Details</CardTitle>
          <CardDescription>
            You've indicated that your vehicle doesn't have outstanding finance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            If your vehicle does have outstanding finance, please go back to the Vehicle Status section and update your selection.
          </p>
        </CardContent>
      </FormSection>
    );
  }

  return (
    <FormSection title="Finance Details">
      <CardHeader>
        <CardTitle>Finance Details</CardTitle>
        <CardDescription>
          Provide information about the outstanding finance on your vehicle
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            control={form.control}
            name="financeAmount"
            rules={{ 
              required: "Finance amount is required",
              pattern: {
                value: /^(\d*\.?\d+|\d+\.?\d*)$/,
                message: "Please enter a valid number"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outstanding Amount (PLN)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. 10000" 
                    type="text"
                    inputMode="decimal"
                    value={field.value || ''}
                    onChange={e => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      field.onChange(isNaN(numValue) ? '' : numValue);
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormDescription>
                  The approximate amount still owed on the vehicle
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Controller
            control={form.control}
            name="financeProvider"
            rules={{ required: "Finance provider is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finance Provider</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select finance provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {financeProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The bank or finance company that provided the loan
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-3">
          <Controller
            control={form.control}
            name="financeEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End of Finance Agreement</FormLabel>
                <FormControl>
                  <Input 
                    type="month"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  When is the finance agreement scheduled to end?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-3">
          <Controller
            control={form.control}
            name="financeDocument"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finance Document (Optional)</FormLabel>
                <FormDescription className="mb-2">
                  Upload a recent finance statement if available
                </FormDescription>
                <FormControl>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="mx-auto"
                      onClick={() => {
                        // This would trigger a file upload dialog in a real implementation
                        console.log("Upload finance document");
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                    <p className="mt-2 text-sm text-muted-foreground">
                      PDF, PNG or JPG up to 5MB
                    </p>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="p-4 border rounded-md border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-800">
            Providing accurate finance information ensures a smoother selling process. We'll work with your finance provider to facilitate the sale.
          </p>
        </div>
      </CardContent>
    </FormSection>
  );
};
