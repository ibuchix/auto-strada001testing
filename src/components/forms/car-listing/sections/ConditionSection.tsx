
/**
 * ConditionSection Component
 * Created: 2025-06-15
 * 
 * Vehicle condition section for car listing form
 */

import { FormSection } from "../FormSection";
import { useFormData } from "../context/FormDataContext";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

export const ConditionSection = () => {
  const { form } = useFormData();
  const isDamaged = form.watch('isDamaged');
  const hasFinance = form.watch('hasFinance');
  const hasPrivatePlate = form.watch('hasPrivatePlate');
  
  return (
    <div className="space-y-8">
      <FormSection title="Vehicle Condition" subtitle="Tell us about the condition of your vehicle">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="isDamaged"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Does the vehicle have any damage?</FormLabel>
                  <FormDescription>
                    Indicate if the vehicle has any visible damage, mechanical issues, etc.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hasServiceHistory"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Service History</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="full" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Full service history
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="partial" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Partial service history
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="none" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        No service history
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hasFinance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Does the vehicle have outstanding finance?</FormLabel>
                  <FormDescription>
                    Indicate if there is any outstanding finance on the vehicle
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {hasFinance && (
            <FormField
              control={form.control}
              name="financeAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outstanding Finance Amount (PLN)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="e.g., 5000" 
                      min={0}
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || '')} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="hasPrivatePlate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Does the vehicle have a private registration plate?</FormLabel>
                  <FormDescription>
                    If yes, please indicate if you'll be selling the vehicle with this plate
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {hasPrivatePlate && (
            <FormField
              control={form.control}
              name="privateReg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Private Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter registration number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      </FormSection>
    </div>
  );
};
