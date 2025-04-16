
/**
 * Changes made:
 * - Enhanced form event handling for better performance
 * - Added optimized form validation with React Hook Form
 * - Improved mobile handling with enhanced UI feedback
 * - 2025-04-20: Fixed type imports to use correct location
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ValuationFormData } from "@/types/validation";
import { UseFormReturn } from "react-hook-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCallback } from "react";

interface ValuationInputProps {
  form: UseFormReturn<ValuationFormData> & {
    formState: { isSubmitting: boolean };
  };
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ValuationInput = ({ form, isLoading, onSubmit }: ValuationInputProps) => {
  const isMobile = useIsMobile();
  
  // Optimized event handler with proper type
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit(e);
    }
  }, [onSubmit, isLoading]);
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ENTER VIN"
                    className={`${isMobile ? 'h-14' : 'h-12'} text-center text-lg border-2 border-secondary/20 bg-white placeholder:text-secondary/70 rounded-md`}
                    disabled={isLoading}
                    maxLength={17}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage className={isMobile ? "text-sm mt-1" : ""} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    placeholder="ENTER MILEAGE (KM)"
                    className={`${isMobile ? 'h-14' : 'h-12'} text-center text-lg border-2 border-secondary/20 bg-white placeholder:text-secondary/70 rounded-md`}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage className={isMobile ? "text-sm mt-1" : ""} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gearbox"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className={`flex gap-6 justify-center bg-white border-2 border-secondary/20 rounded-md ${isMobile ? 'p-5' : 'p-4'}`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value="manual" 
                        id="manual" 
                        className={isMobile ? "h-6 w-6" : ""}
                      />
                      <Label 
                        htmlFor="manual" 
                        className={`font-medium cursor-pointer ${isMobile ? 'text-base' : ''}`}
                      >
                        Manual
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value="automatic" 
                        id="automatic" 
                        className={isMobile ? "h-6 w-6" : ""}
                      />
                      <Label 
                        htmlFor="automatic" 
                        className={`font-medium cursor-pointer ${isMobile ? 'text-base' : ''}`}
                      >
                        Automatic
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage className={isMobile ? "text-sm mt-1" : ""} />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className={`w-full ${isMobile ? 'h-14' : 'h-12'} bg-secondary hover:bg-secondary/90 text-white text-lg rounded-md flex items-center justify-center gap-2`}
          disabled={isLoading || form.formState.isSubmitting}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              GETTING VALUATION...
            </>
          ) : (
            <>
              VALUE YOUR CAR
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
