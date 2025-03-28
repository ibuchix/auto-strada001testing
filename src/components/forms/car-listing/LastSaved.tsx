
/**
 * Changes made:
 * - 2027-07-25: Updated props to use timestamp instead of lastSaved to fix TypeScript errors
 * - 2025-10-01: Improved formatting and added "saving" indicator
 */

import { formatDistanceToNow } from 'date-fns';

interface LastSavedProps {
  timestamp: Date | null;
  isSaving?: boolean;
}

export const LastSaved = ({ timestamp, isSaving = false }: LastSavedProps) => {
  if (isSaving) {
    return (
      <p className="text-sm text-subtitle italic">
        Saving...
      </p>
    );
  }
  
  if (!timestamp) return null;

  const timeDistance = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <p className="text-sm text-subtitle italic">
      Last saved: {timeDistance}
    </p>
  );
};
