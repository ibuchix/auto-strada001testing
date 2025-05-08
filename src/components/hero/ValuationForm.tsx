
/**
 * Changes made:
 * - 2025-04-29: Fixed form structure to prevent nested forms
 * - 2025-04-30: Fixed import of ValuationResult (using named import)
 * - 2025-04-30: Fixed parameter types in onSubmit handler
 * - 2025-05-10: Updated import paths for refactored hooks
 * - 2025-05-15: Fixed onSubmit handler to properly use form.handleSubmit
 * - 2025-05-16: Fixed ValuationInput props to match types consistently
 * - 2025-05-17: Fixed type imports to use consistent ValuationFormData interface
 * - 2025-05-24: Fixed import paths and rendering issues to ensure content appears
 * - 2025-05-25: Fixed form submission handler to resolve type mismatch error
 */

import React, { useEffect } from 'react';
import ValuationInput from './ValuationInput';
import { ValuationResult } from './ValuationResult';
import { useEnhancedValuationForm } from '@/hooks/valuation/useEnhancedValuationForm';

export const ValuationForm = () => {
  const {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    handleFormSubmit,
    resetForm
  } = useEnhancedValuationForm();
  
  // Log to help debug rendering
  useEffect(() => {
    console.log("ValuationForm rendered");
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-gray-100">
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <ValuationInput form={form} />
      </form>

      {valuationResult && (
        <ValuationResult 
          open={showDialog}
          onOpenChange={setShowDialog}
          result={valuationResult}
          onReset={resetForm}
        />
      )}
    </div>
  );
};
