
/**
 * Changes made:
 * - 2025-04-27: Enhanced form validation and error handling 
 * - 2025-04-29: Added loading indicator and timeout handling
 * - 2025-05-03: Updated dialog usage to prevent duplicate close buttons
 * - 2025-05-04: Removed title and description text to restore previous design
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ValuationInput } from "./ValuationInput";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import { ValuationResult } from "./ValuationResult";
import { useEnhancedValuationForm } from "@/hooks/valuation/useEnhancedValuationForm";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export const ValuationForm = () => {
  const {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit,
    handleContinue,
    resetForm,
  } = useEnhancedValuationForm();

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-lg shadow-md p-6 relative z-10 w-full max-w-lg mx-auto"
      >
        <ValuationInput
          form={form}
          isLoading={isLoading}
          onReset={resetForm}
        />
      </form>

      {/* Use Dialog with hideCloseButton prop to prevent duplicate buttons */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg p-0 overflow-hidden" hideCloseButton>
          {valuationResult && (
            <ValuationResult
              valuationResult={valuationResult}
              onClose={() => setShowDialog(false)}
              onContinue={handleContinue}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
