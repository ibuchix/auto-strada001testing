
/**
 * Component for displaying alert messages in the photo upload section
 * - 2025-04-05: Created to separate alert display from main component
 * - 2025-04-05: Supports both error and success alerts with appropriate styling
 * - 2025-04-06: Updated styling to match application design language
 */
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
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
    <Alert className={`mb-4 ${type === 'success' ? 'bg-success/10 border-success/20' : 'bg-primary/10 border-primary/20'}`}>
      <div className="flex justify-between w-full">
        <div className="flex items-start gap-2">
          {type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
          ) : (
            <CheckCircle className="h-4 w-4 text-success mt-0.5" />
          )}
          <div>
            <AlertTitle className={type === 'success' ? 'text-success font-kanit' : 'text-primary font-kanit'}>
              {message}
            </AlertTitle>
            {description && (
              <AlertDescription className="text-subtitle font-kanit text-sm">
                {description}
              </AlertDescription>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-subtitle hover:text-body" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};
