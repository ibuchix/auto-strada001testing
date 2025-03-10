
/**
 * Changes made:
 * - 2024-03-28: Created DealerRegistrationForm component
 * - 2024-03-29: Ensured all required form fields are properly typed
 */

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  dealershipName: z.string().min(2, {
    message: "Dealership name must be at least 2 characters.",
  }),
  licenseNumber: z.string().min(5, {
    message: "License number must be at least 5 characters.",
  }),
  supervisorName: z.string().min(2, {
    message: "Supervisor name must be at least 2 characters.",
  }),
  taxId: z.string().min(5, {
    message: "Tax ID must be at least 5 characters.",
  }),
  businessRegNumber: z.string().min(5, {
    message: "Business registration number must be at least 5 characters.",
  }),
  address: z.string().min(1, {
    message: "Address is required",
  }),
});

export type DealerFormData = z.infer<typeof formSchema>;

interface DealerRegistrationFormProps {
  onSubmit: (values: DealerFormData) => void;
  isLoading: boolean;
}

export const DealerRegistrationForm = ({
  onSubmit,
  isLoading
}: DealerRegistrationFormProps) => {
  const form = useForm<DealerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealershipName: "",
      licenseNumber: "",
      supervisorName: "",
      taxId: "",
      businessRegNumber: "",
      address: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="dealershipName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dealership Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter dealership name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter license number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supervisorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supervisor Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter supervisor name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter tax ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessRegNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Reg. Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter business registration number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
                <Input placeholder="Enter address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>
    </Form>
  );
};
