
/**
 * BasicInfoSection Component
 * Created: 2025-06-15
 * Updated: 2025-08-23 - Removed price field as prices should only come from valuation
 * 
 * Basic vehicle information section for car listing form
 */

import { FormSection } from "./FormSection";
import { useFormData } from "./context/FormDataContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const BasicInfoSection = () => {
  const { form } = useFormData();
  const currentYear = new Date().getFullYear();
  
  return (
    <FormSection title="Vehicle Information" subtitle="Please provide the basic details of your vehicle">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make</FormLabel>
              <FormControl>
                <Input placeholder="e.g., BMW, Audi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input placeholder="e.g., X5, A4" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 2020" 
                  min={1900}
                  max={currentYear + 1}
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || '')} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mileage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mileage</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 50000" 
                  min={0}
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || '')} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="transmission"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transmission</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VIN</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Vehicle Identification Number" 
                  maxLength={17}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="mt-6">
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Enter your VIN to automatically populate vehicle details. Your vehicle's price will be determined based on your valuation results.
          </AlertDescription>
        </Alert>
      </div>
    </FormSection>
  );
};
