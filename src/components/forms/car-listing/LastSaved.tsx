interface LastSavedProps {
  timestamp: Date | null;
}

export const LastSaved = ({ timestamp }: LastSavedProps) => {
  if (!timestamp) return null;

  return (
    <p className="text-sm text-subtitle italic">
      Last saved: {timestamp.toLocaleTimeString()}
    </p>
  );
};