
/**
 * Changes made:
 * - 2024-07-06: Created ResetPassword component for password recovery
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset instructions sent to your email");
        navigate("/auth");
      }
    } catch (error) {
      toast.error("An error occurred while processing your request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#222020] mb-2 font-kanit">Reset Password</h1>
        <p className="text-subtitle">Enter your email to receive reset instructions</p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#DC143C] hover:bg-[#DC143C]/90"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Instructions"}
        </Button>

        <div className="text-center mt-4">
          <Button
            variant="link"
            className="text-iris"
            onClick={() => navigate("/auth")}
          >
            Back to Sign In
          </Button>
        </div>
      </form>
    </div>
  );
};
