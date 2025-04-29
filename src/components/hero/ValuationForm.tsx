
/**
 * Changes made:
 * - 2025-04-29: Fixed form structure to prevent nested forms
 * - 2025-04-30: Fixed import of ValuationResult (using named import)
 * - 2025-04-30: Fixed parameter types in onSubmit handler
 * - 2025-05-10: Updated import paths for refactored hooks
 * - 2025-05-15: Fixed onSubmit handler to properly use form.handleSubmit
 */

import React from 'react';
import ValuationInput from './ValuationInput';
import { ValuationResult } from './ValuationResult';
import { useValuationForm } from '@/hooks/valuation/useValuationForm';

export const ValuationForm = () => {
  const {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit,
    resetForm
  } = useValuationForm();

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-lg rounded-xl p-5 shadow-lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
