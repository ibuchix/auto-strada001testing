
/**
 * Changes made:
 * - Updated to use the useFormData hook correctly with the exposed methods
 * - This component demonstrates how to use the useFormData hook methods directly
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormData } from "../context/FormDataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const VehicleDetailsSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  // Use the form context with directly exposed methods
  const { control, watch, setValue } = useFormData();
  
  // Example of watching specific form values
  const make = watch("make");
  const model = watch("model");
  const year = watch("year");
  
  const handleAutoFill = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call to auto-fill data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Example of setting form values
      setValue("make", "Toyota");
      setValue("model", "Corolla");
      setValue("year", 2022);
      setValue("mileage", 15000);
      
      toast.success("Vehicle details auto-filled");
    } catch (error) {
      toast.error("Failed to auto-fill vehicle details");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Vehicle Details</h2>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleAutoFill} 
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Auto-fill"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="make"
          rules={{ required: "Make is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Toyota" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="model"
          rules={{ required: "Model is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Corolla" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="year"
          rules={{ required: "Year is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  placeholder="e.g. 2020" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="mileage"
          rules={{ required: "Mileage is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mileage</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  placeholder="e.g. 50000" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {make && model && year && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">
            Selected Vehicle: {year} {make} {model}
          </p>
        </div>
      )}
    </Card>
  );
};
