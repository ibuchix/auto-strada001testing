
/**
 * BasicInfoSection Component
 * Created: 2025-06-16
 * 
 * Basic information section for car listing form
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormData } from "../context/FormDataContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

export const BasicInfoSection = () => {
  const { form } = useFormData();
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vehicle Details</h2>
      
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Please ensure all vehicle details match your registration documents.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ford, BMW, Toyota" {...field} />
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
                <Input placeholder="e.g. Focus, 3 Series, Corolla" {...field} />
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
              <FormLabel>Year of Manufacture</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g. 2018" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                  placeholder="e.g. 45000" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)} 
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
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
              <FormLabel>VIN (Vehicle Identification Number)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. WVWZZZ1KZAM059314" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
