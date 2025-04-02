
/**
 * Changes made:
 * - Enhanced button styling to match design system
 * - Improved loading state visual feedback
 * - Added consistent sizing and spacing
 * - Fixed button text alignment
 * - Updated to match new visual hierarchy
 * - 2028-06-15: Added micro-interactions for button states
 * - 2024-06-18: Added disabled prop to fix type errors
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, CheckCircle } from 'lucide-react';

export interface SaveButtonProps {
  onClick: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
  className?: string;
  label?: string;
  showSuccessState?: boolean;
  disabled?: boolean; // Added disabled prop
}

export const SaveButton = ({ 
  onClick, 
  isSaving = false,
  isLoading = false, 
  className = '',
  label = 'Save Progress',
  showSuccessState = false,
  disabled = false  // Added with default value
}: SaveButtonProps) => {
  const isProcessing = isSaving || isLoading;
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Handle success state animation
  useEffect(() => {
    if (showSuccessState && !isProcessing) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessState, isProcessing]);
  
  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={onClick} 
      disabled={isProcessing || disabled} // Use the disabled prop
      className={`flex items-center justify-center border-[#383B39] hover:bg-[#383B39]/10 text-[#383B39] min-w-36 group transition-all duration-300 ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 size={18} className="animate-spin mr-2" />
          <span>Saving...</span>
        </>
      ) : showSuccess ? (
        <>
          <CheckCircle size={18} className="mr-2 text-green-500 animate-scale-in" />
          <span className="text-green-500">Saved!</span>
        </>
      ) : (
        <>
          <Save size={18} className="mr-2 transition-transform duration-300 group-hover:scale-110" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
};
