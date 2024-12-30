import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface AdditionalInfoSectionProps {
  form: UseFormReturn<CarListingFormData>;
}

export const AdditionalInfoSection = ({ form }: AdditionalInfoSectionProps) => {
  return (
    <>
      <div className="space-y-4">
        <Label>Additional Information</Label>
        <div className="space-y-4">
          <div className="space-y-4">
            <Label>Seat Material</Label>
            <RadioGroup
              value={form.watch("seatMaterial")}
              onValueChange={(value) => form.setValue("seatMaterial", value as CarListingFormData["seatMaterial"])}
              className="grid grid-cols-2 gap-4"
            >
              {["cloth", "leather", "half leather", "suede"].map((material) => (
                <div key={material} className="flex items-center space-x-2">
                  <RadioGroupItem value={material} id={material} />
                  <Label htmlFor={material} className="capitalize">
                    {material}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Number of Keys</Label>
            <RadioGroup
              value={form.watch("numberOfKeys")}
              onValueChange={(value) => form.setValue("numberOfKeys", value as "1" | "2")}
              className="grid grid-cols-2 gap-4"
            >
              {["1", "2"].map((number) => (
                <div key={number} className="flex items-center space-x-2">
                  <RadioGroupItem value={number} id={`keys-${number}`} />
                  <Label htmlFor={`keys-${number}`}>{number} Key{number === "2" && "s"}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Finance Information</Label>
        <Input
          type="number"
          placeholder="Outstanding Finance Amount (PLN)"
          {...form.register("financeAmount")}
        />
        <Input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) form.setValue("financeDocument", file);
          }}
        />
      </div>
    </>
  );
};