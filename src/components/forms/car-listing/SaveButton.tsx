
/**
 * A button component for saving form progress
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface SaveButtonProps {
  onClick: () => void;
  isSaving?: boolean;
  className?: string;
}

export const SaveButton = ({ onClick, isSaving = false, className = '' }: SaveButtonProps) => {
  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={onClick} 
      disabled={isSaving}
      className={`flex items-center gap-2 ${className}`}
    >
      <Save size={16} />
      {isSaving ? 'Saving...' : 'Save Progress'}
    </Button>
  );
};
