
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted types from RealtimeProvider.tsx
 * - 2024-12-19: Fixed missing exports and consolidated all types
 * - 2024-12-20: Added descriptions to improve type documentation
 * - 2024-12-20: Fixed export issues for ConnectionState, RealtimeContextType and RealtimeProviderProps
 */

import { ReactNode } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

// Connection states enum
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting'
}

export interface RealtimeContextType {
  isConnected: boolean;
  channels: Record<string, RealtimeChannel>;
  subscribe: (channelName: string, tableName: string, callback: (payload: any) => void) => RealtimeChannel;
  unsubscribe: (channelName: string) => void;
  reconnect: () => Promise<void>;
}

export interface RealtimeProviderProps {
  children: ReactNode;
}

export type EnhancedToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  description?: string,
  duration?: number
) => void;

// A union type that can handle all Supabase realtime payload types
export type RealtimePayload = {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: string;
  new: Record<string, any>;
  old: Record<string, any>;
  errors: any;
};
