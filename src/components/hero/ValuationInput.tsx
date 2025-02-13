
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ValuationFormData } from "@/types/validation";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface ValuationInputProps {
  form: UseFormReturn<ValuationFormData>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  vinInputRef?: React.RefObject<HTMLInputElement>;
}

export const ValuationInput = ({ form, isLoading, onSubmit, vinInputRef }: ValuationInputProps) => {
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VIN Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your VIN number"
                  {...field}
                  ref={vinInputRef}
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
              <FormLabel>Current Mileage</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter current mileage"
                  {...field}
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
            <FormItem className="space-y-3">
              <FormLabel>Transmission</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual">Manual</Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="automatic" id="automatic" />
                    <Label htmlFor="automatic">Automatic</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Valuation...
            </>
          ) : (
            "Get Valuation"
          )}
        </Button>
      </form>
    </Form>
  );
};
