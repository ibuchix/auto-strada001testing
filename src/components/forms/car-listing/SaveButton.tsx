
/**
 * Updated SaveButton component to support isLoading state
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

export interface SaveButtonProps {
  onClick: () => void;
  isSaving?: boolean;
  isLoading?: boolean; // Added isLoading prop
  className?: string;
  label?: string; // Added label prop
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
      className={`flex items-center gap-2 ${className}`}
    >
      {isProcessing ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Save size={16} />
      )}
      {isProcessing ? 'Saving...' : label}
    </Button>
  );
};
