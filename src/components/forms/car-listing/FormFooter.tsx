
/**
 * Changes made:
 * - Added saving indicator
 * - Improved save button UI with progress indication
 * - Fixed offline status display
 */

import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { WifiOff, Save, Loader2 } from 'lucide-react';

interface FormFooterProps {
  lastSaved: Date | null;
  isOffline: boolean;
  onSave: () => void;
  isSaving?: boolean;
}

export const FormFooter = ({ lastSaved, isOffline, onSave, isSaving = false }: FormFooterProps) => {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-8 text-sm">
      <div className="flex items-center">
        {lastSaved && (
          <p className="text-muted-foreground mr-4">
            Last saved: {formatDistanceToNow(lastSaved, { addSuffix: true })}
          </p>
        )}
        
        {isOffline && (
          <div className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <WifiOff className="h-4 w-4 mr-1" />
            <span>Offline</span>
          </div>
        )}
      </div>
      
      <div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
