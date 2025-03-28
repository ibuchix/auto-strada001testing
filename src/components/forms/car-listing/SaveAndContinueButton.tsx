
/**
 * SaveAndContinueButton Component
 * Allows users to save their form progress and continue later
 * Enhanced with improved visual hierarchy and micro-interactions
 */

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle } from "lucide-react";
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
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Reset success state after a delay
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);
  
  const handleSaveAndExit = async () => {
    if (isDisabled || isSaving) return;
    
    try {
      setSaving(true);
      // Save the form data
      await onSave();
      
      // Show success state
      setShowSuccess(true);
      
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
      const navigationTimer = setTimeout(() => {
        navigate("/dashboard/seller");
      }, 1500);
      
      return () => clearTimeout(navigationTimer);
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress", {
        description: "Please try again or contact support if the problem persists."
      });
    } finally {
      // Allow a moment to see the success state before clearing
      setTimeout(() => {
        setSaving(false);
      }, 300);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="flex items-center gap-2 border-[#383B39] hover:bg-[#383B39]/10 text-[#383B39] group transition-all duration-300"
      onClick={handleSaveAndExit}
      disabled={isDisabled || isSaving}
    >
      {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showSuccess ? (
        <CheckCircle className="h-4 w-4 text-green-500 animate-scale-in" />
      ) : (
        <Save className="h-4 w-4 transition-transform group-hover:scale-110 duration-300" />
      )}
      <span>
        {isSaving 
          ? "Saving..." 
          : showSuccess 
            ? "Saved!" 
            : "Save & Continue Later"}
      </span>
    </Button>
  );
};
