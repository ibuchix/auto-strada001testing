
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
