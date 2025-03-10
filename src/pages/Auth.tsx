
import { useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  address: z.string().optional(),
});

const AuthPage = () => {
  const [isDealer, setIsDealer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabaseClient = useSupabaseClient();
  const session = useSession();
  const user = useUser();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
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

  const [formData, setFormData] = useState({
    dealershipName: "",
    licenseNumber: "",
    supervisorName: "",
    taxId: "",
    businessRegNumber: "",
    address: "",
  });

  useEffect(() => {
    if (session) {
      if (user?.role === "dealer") {
        navigate("/dashboard/dealer");
      } else if (user?.role === "seller") {
        navigate("/dashboard/seller");
      } else {
        navigate("/");
      }
    }
  }, [session, navigate, user?.role]);

  const registerDealer = async (user: any) => {
    try {
      const { error } = await supabase
        .from('dealers')
        .insert({
          user_id: user.id,
          dealership_name: formData.dealershipName,
          license_number: formData.licenseNumber,
          supervisor_name: formData.supervisorName,
          tax_id: formData.taxId,
          business_registry_number: formData.businessRegNumber,
          address: formData.address || 'N/A'
        });

      if (error) throw error;

      toast.success("Dealer registration successful!");
      navigate("/dashboard/dealer");
    } catch (error: any) {
      console.error("Error registering dealer:", error);
      toast.error(error.message || "Failed to register dealer");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    // Using spread to ensure all required keys are present
    setFormData({
      ...formData,
      ...values
    });

    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-4 space-y-4">
        <h1 className="text-3xl font-bold text-center">
          {isDealer ? "Register as Dealer" : "Sign In / Sign Up"}
        </h1>

        {isDealer ? (
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
        ) : (
          <Auth
            supabaseClient={supabaseClient}
            appearance={{ theme: 'default' }}
            providers={["google"]}
            redirectTo={`${window.location.origin}/auth`}
          />
        )}

        <Button
          variant="link"
          onClick={() => setIsDealer(!isDealer)}
          className="w-full"
        >
          {isDealer
            ? "Back to Sign In / Sign Up"
            : "Register as a Dealer instead"}
        </Button>
      </div>
    </div>
  );
};

export default AuthPage;
