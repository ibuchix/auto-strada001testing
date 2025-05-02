
/**
 * Damage Details Section
 * Created: 2025-06-07
 * Contains fields for reporting vehicle damage
 * Updated: 2025-06-08: Fixed type error with DamageType
 * Updated: 2025-06-08: Fixed missing photo property in DamageReport
 */

import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFieldArray } from "react-hook-form";
import { DamageType } from "@/types/forms";

export const DamageDetailsSection = () => {
  const { form } = useFormData();
  const { fields, append, remove } = useFieldArray({
    control: form?.control,
    name: "damageReports",
  });
  
  const isDamaged = form?.watch("isDamaged");
  
  if (!form) {
    return <div>Loading form...</div>;
  }
  
  if (!isDamaged) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-gray-600 italic">This section is only required if your vehicle has damage.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-md">
        <p className="text-amber-700 text-sm">
          Please provide details of any damage to your vehicle. Being thorough and honest will help us provide an accurate valuation.
        </p>
      </div>
      
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-md space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Damage Report #{index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`damageReports.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Damage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Scratch, Dent, Engine issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={`damageReports.${index}.location`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Front bumper, Driver's door" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name={`damageReports.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Please describe the damage in detail" 
                    className="min-h-[80px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ 
          type: 'scratch' as DamageType, 
          location: '', 
          description: '',
          severity: 'minor',
          photo: null // Add the required photo property with null value
        })}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Damage Report
      </Button>
    </div>
  );
};
