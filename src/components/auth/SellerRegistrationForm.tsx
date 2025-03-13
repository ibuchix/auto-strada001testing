
/**
 * Changes made:
 * - 2024-06-24: Created SellerRegistrationForm component for seller registration
 * - 2024-06-27: Enhanced form with better styling and visual feedback
 * - 2024-06-28: Added email confirmation field for better validation
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  confirmEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Email addresses do not match",
  path: ["confirmEmail"],
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SellerFormData = z.infer<typeof formSchema>;

interface SellerRegistrationFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
}

export const SellerRegistrationForm = ({
  onSubmit,
  isLoading
}: SellerRegistrationFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SellerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      confirmEmail: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (values: SellerFormData) => {
    onSubmit(values.email, values.password);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-body font-medium">Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your email" 
                  type="email" 
                  className="h-12 focus-visible:ring-primary/30"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-[#DC143C]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-body font-medium">Confirm Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Confirm your email" 
                  type="email" 
                  className="h-12 focus-visible:ring-primary/30"
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-[#DC143C]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-body font-medium">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Enter password" 
                    type={showPassword ? "text" : "password"} 
                    className="h-12 pr-10 focus-visible:ring-primary/30"
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage className="text-[#DC143C]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-body font-medium">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Confirm password" 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="h-12 pr-10 focus-visible:ring-primary/30"
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage className="text-[#DC143C]" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full h-12 mt-2 bg-primary text-white font-oswald text-base shadow-sm hover:shadow-md transition-all duration-300" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Creating Account...
            </span>
          ) : "Create Seller Account"}
        </Button>
      </form>
    </Form>
  );
};
