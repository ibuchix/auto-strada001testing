
/**
 * Component for displaying alert messages in the photo upload section
 * - 2025-04-05: Created to separate alert display from main component
 * - 2025-04-05: Supports both error and success alerts with appropriate styling
 */
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhotoUploadError } from '../types';

interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
  description?: string;
  onClose: () => void;
}

export const AlertMessage = ({ 
  type, 
  message, 
  description, 
  onClose 
}: AlertMessageProps) => {
  return (
    <Alert className={`mb-4 ${type === 'success' ? 'bg-green-50 border-green-200' : 'variant-destructive'}`}>
      <div className="flex justify-between w-full">
        <div className="flex items-start gap-2">
          {type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5" />}
          <div>
            <AlertTitle className={type === 'success' ? 'text-green-700' : ''}>{message}</AlertTitle>
            {description && (
              <AlertDescription>{description}</AlertDescription>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};
