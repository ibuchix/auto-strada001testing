
/**
 * Save button with loading state
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface SaveButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export const SaveButton = ({ 
  onClick, 
  isLoading = false, 
  label = 'Save',
  variant = 'outline',
  size = 'sm'
}: SaveButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-1"
    >
      <Save size={16} />
      <span>{label}</span>
    </Button>
  );
};
