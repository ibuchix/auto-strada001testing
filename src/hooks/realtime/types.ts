
/**
 * Changes made:
 * - 2024-12-09: Created types file for realtime functionality
 */

export type EnhancedToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  description?: string,
  duration?: number
) => void;

export type RealtimePayload = {
  new: any;
  old: any;
  schema: string;
  table: string;
  type: string;
  commit_timestamp: string;
  eventType: string;
};
