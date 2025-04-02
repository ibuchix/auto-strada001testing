
/**
 * Loading State component
 * - Provides feedback while the form is loading
 */
import React from 'react';

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#DC143C] animate-spin"></div>
      <p className="text-lg font-medium text-gray-700">Loading form...</p>
      <p className="text-sm text-gray-500">Please wait while we prepare your listing form</p>
    </div>
  );
};
