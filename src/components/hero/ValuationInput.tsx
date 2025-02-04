import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ValuationFormData } from "@/types/validation";
import { UseFormReturn } from "react-hook-form";

interface ValuationInputProps {
  form: UseFormReturn<ValuationFormData>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ValuationInput = ({ form, isLoading, onSubmit }: ValuationInputProps) => {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6 max-w-sm mx-auto">
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
                    className="h-12 text-center text-lg border-2 border-secondary/20 bg-white placeholder:text-secondary/70 rounded-md"
                    disabled={isLoading}
                    maxLength={17}
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
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    placeholder="ENTER MILEAGE (KM)"
                    className="h-12 text-center text-lg border-2 border-secondary/20 bg-white placeholder:text-secondary/70 rounded-md"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
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
                    className="flex gap-6 justify-center bg-white border-2 border-secondary/20 rounded-md p-4"
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="font-medium cursor-pointer">
                        Manual
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="automatic" id="automatic" />
                      <Label htmlFor="automatic" className="font-medium cursor-pointer">
                        Automatic
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white text-lg rounded-md flex items-center justify-center gap-2"
          disabled={isLoading}
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