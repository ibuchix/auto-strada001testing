
/**
 * Changes made:
 * - 2024-06-24: Created SellerRegistrationForm component for seller registration
 * - 2024-06-27: Enhanced form with better styling and visual feedback
 * - 2024-06-28: Added email confirmation field for better validation
 * - 2024-07-06: Enhanced password validation and improved error messages
 * - Updated 2025-06-15 (bounty): Included zod validation for username, 
 * added username field for interface SellerRegistrationFormProps.onSubmit(params),
 * added username to useForm hook defaultValues object,
 * added username param to custom handleSubmit function signature,
 * added Form field for username
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
  username: z.string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must not exceed 20 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  confirmEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
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
  onSubmit: (username: string, email: string, password: string) => void;
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
      username:"",
      email: "",
      confirmEmail: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (values: SellerFormData) => {
    onSubmit(values.username, values.email, values.password);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-body font-medium">Username</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter your username" 
                  type="text" 
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
