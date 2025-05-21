
/**
 * FinanceDetailsSection Component
 * Created: 2025-05-02
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 * Updated: 2025-05-25 - Fixed field name typing issues by using string cast
 */

import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { CalendarIcon, Upload } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { watchField, setFieldValue } from "@/utils/formHelpers";

export const FinanceDetailsSection = () => {
  const { form } = useFormData();
  const [financeDocument, setFinanceDocument] = useState<File | null>(null);
  
  const hasFinance = watchField<boolean>(form, "hasOutstandingFinance" as any) || false;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFinanceDocument(e.target.files[0]);
    }
  };
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="hasOutstandingFinance"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Does this vehicle have outstanding finance?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
      
      {hasFinance && (
        <div className="space-y-4 pl-8 border-l-2 border-gray-200">
          <FormField
            control={form.control}
            name="financeProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finance Provider</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter finance provider name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="financeAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Outstanding Finance Amount (PLN)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
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
            name="financeEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Finance End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <FormLabel>Finance Document</FormLabel>
            <div className="mt-2 p-4 border border-dashed rounded-md flex flex-col items-center justify-center">
              <input
                id="finance-document"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf,image/*"
              />
              <label htmlFor="finance-document">
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {financeDocument ? financeDocument.name : "Upload Document"}
                  </span>
                </Button>
              </label>
              <p className="text-sm text-muted-foreground mt-2">
                PDF, PNG or JPG (max 5MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
