
/**
 * Changes made:
 * - 2023-07-15: Updated props to use timestamp instead of date for better compatibility
 */

import { formatDistanceToNow } from "date-fns";

interface LastSavedProps {
  timestamp: Date | null;
  isOffline?: boolean;
}

export const LastSaved = ({ timestamp, isOffline }: LastSavedProps) => {
  if (!timestamp) {
    return null;
  }

  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <div className="text-xs text-muted-foreground flex items-center">
      <span>
        {isOffline ? "Saved locally" : "Last saved"} {timeAgo}
      </span>
    </div>
  );
};
