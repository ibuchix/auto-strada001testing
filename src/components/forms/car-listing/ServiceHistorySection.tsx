import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { Input } from "@/components/ui/input";

interface ServiceHistorySectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;  // Added carId prop as optional
}

export const ServiceHistorySection = ({ form, carId }: ServiceHistorySectionProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">Service History</h2>
      
      <div className="space-y-6 p-6 bg-accent/30 rounded-lg">
        <FormField
          control={form.control}
          name="serviceHistoryType"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="text-base font-semibold">Service History Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="full"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Full Service History</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="partial"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Partial Service History</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="none"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">No Service History</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem 
                        value="not_due"
                        className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">First Service Not Due Yet</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Service History Documents</FormLabel>
          <FormField
            control={form.control}
            name="serviceHistoryFiles"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      field.onChange(files);
                    }}
                    className="bg-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </FormControl>
                <p className="text-sm text-subtitle mt-2">
                  Upload service history documents (PDF images)
                </p>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};