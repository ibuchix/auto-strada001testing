
/**
 * Changes made:
 * - Enhanced button styling to match design system
 * - Improved loading state visual feedback
 * - Added consistent sizing and spacing
 * - Fixed button text alignment
 * - Updated to match new visual hierarchy
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

export interface SaveButtonProps {
  onClick: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
  className?: string;
  label?: string;
}

export const SaveButton = ({ 
  onClick, 
  isSaving = false,
  isLoading = false, 
  className = '',
  label = 'Save Progress'
}: SaveButtonProps) => {
  const isProcessing = isSaving || isLoading;
  
  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={onClick} 
      disabled={isProcessing}
      className={`flex items-center justify-center border-[#383B39] hover:bg-[#383B39]/10 text-[#383B39] min-w-36 ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 size={18} className="animate-spin mr-2" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Save size={18} className="mr-2" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
};
