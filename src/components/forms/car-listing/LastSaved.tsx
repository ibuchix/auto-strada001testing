
/**
 * Changes made:
 * - 2027-07-25: Updated props to use timestamp instead of lastSaved to fix TypeScript errors
 */

import { formatDistanceToNow } from 'date-fns';

interface LastSavedProps {
  timestamp: Date | null;
}

export const LastSaved = ({ timestamp }: LastSavedProps) => {
  if (!timestamp) return null;

  const timeDistance = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <p className="text-sm text-subtitle italic">
      Last saved: {timeDistance}
    </p>
  );
};
