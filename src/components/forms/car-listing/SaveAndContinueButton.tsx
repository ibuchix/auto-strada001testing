
/**
 * SaveAndContinueButton Component
 * Allows users to save their form progress and continue later
 */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SaveAndContinueButtonProps {
  onSave: () => Promise<void>;
  carId?: string;
  isDisabled?: boolean;
}

export const SaveAndContinueButton = ({ 
  onSave, 
  carId, 
  isDisabled = false 
}: SaveAndContinueButtonProps) => {
  const [isSaving, setSaving] = useState(false);
  const navigate = useNavigate();
  
  const handleSaveAndExit = async () => {
    if (isDisabled || isSaving) return;
    
    try {
      setSaving(true);
      // Save the form data
      await onSave();
      
      // Show success toast with action to copy link
      toast.success("Progress saved successfully", {
        description: "You can return to this form later from your dashboard.",
        action: {
          label: "Go to Dashboard",
          onClick: () => navigate("/dashboard/seller")
        },
        duration: 5000
      });
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard/seller");
      }, 1500);
      
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress", {
        description: "Please try again or contact support if the problem persists."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="flex items-center gap-2"
      onClick={handleSaveAndExit}
      disabled={isDisabled || isSaving}
    >
      <Share className="h-4 w-4" />
      <span>{isSaving ? "Saving..." : "Save & Continue Later"}</span>
    </Button>
  );
};
