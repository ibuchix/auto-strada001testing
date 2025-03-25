
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted types from RealtimeProvider.tsx
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
