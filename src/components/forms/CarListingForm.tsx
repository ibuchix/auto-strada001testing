import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

export const CarListingForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');

  const form = useForm({
    defaultValues: {
      name: "",
      address: "",
      mobileNumber: "",
      isDamaged: false,
      isRegisteredInPoland: false,
      features: {
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false,
      },
      seatMaterial: "cloth",
      numberOfKeys: "1",
      hasToolPack: false,
      hasDocumentation: false,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "",
      financeDocument: null as File | null,
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('cars').insert({
        ...valuationData,
        seller_id: (await supabase.auth.getUser()).data.user?.id,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        features: data.features,
        seat_material: data.seatMaterial,
        number_of_keys: parseInt(data.numberOfKeys),
        has_tool_pack: data.hasToolPack,
        has_documentation: data.hasDocumentation,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
      });

      if (error) throw error;

      toast.success("Car listed successfully!");
      navigate('/dashboard/seller');
    } catch (error) {
      console.error('Error listing car:', error);
      toast.error("Failed to list car. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" required />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <Label>Vehicle Status</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isDamaged"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Vehicle is damaged</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRegisteredInPoland"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Registered in Poland</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Vehicle Features</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries({
                satNav: "Satellite Navigation",
                panoramicRoof: "Panoramic Roof",
                reverseCamera: "Reverse Camera",
                heatedSeats: "Heated Seats",
                upgradedSound: "Upgraded Sound System",
              }).map(([key, label]) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`features.${key}`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>{label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="seatMaterial"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Seat Material</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberOfKeys"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Number of Keys</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    {["1", "2"].map((number) => (
                      <div key={number} className="flex items-center space-x-2">
                        <RadioGroupItem value={number} id={`keys-${number}`} />
                        <Label htmlFor={`keys-${number}`}>{number} Key{number === "2" && "s"}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <Label>Additional Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "hasToolPack", label: "Standard Tool Pack Included" },
                { name: "hasDocumentation", label: "Vehicle Documentation Included" },
                { name: "isSellingOnBehalf", label: "Selling on Someone's Behalf" },
                { name: "hasPrivatePlate", label: "Has Private Plate" },
              ].map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>{label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Finance Information</Label>
            <FormField
              control={form.control}
              name="financeAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outstanding Finance Amount (PLN)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="financeDocument"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Finance Settlement Document</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onChange(file);
                      }}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-secondary hover:bg-secondary/90 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Listing Car..." : "List Car"}
        </Button>
      </form>
    </Form>
  );
};