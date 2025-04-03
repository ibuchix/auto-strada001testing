
/**
 * Changes made:
 * - Updated to use FormDataContext instead of requiring form prop
 */
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormData } from "./context/FormDataContext";

export const AdditionalInfoSection = () => {
  const { form } = useFormData();
  
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="seatMaterial"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Seat Material</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select seat material" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cloth">Cloth</SelectItem>
                <SelectItem value="leather">Leather</SelectItem>
                <SelectItem value="half leather">Half Leather</SelectItem>
                <SelectItem value="suede">Suede</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="numberOfKeys"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Keys</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select number of keys" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
};
