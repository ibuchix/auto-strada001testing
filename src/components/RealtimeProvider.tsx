
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeProviderProps {
  children: ReactNode;
}

interface RealtimeContextType {
  isConnected: boolean;
  channels: Record<string, RealtimeChannel>;
  subscribe: (channelName: string, tableName: string, callback: (payload: any) => void) => RealtimeChannel;
  unsubscribe: (channelName: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({});

  // Initialize realtime connection
  useEffect(() => {
    const setupRealtime = async () => {
      try {
        supabase.realtime.setAuth(session?.access_token || null);
        await supabase.realtime.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Error connecting to realtime:', error);
        setIsConnected(false);
      }
    };

    setupRealtime();

    return () => {
      // Disconnect on cleanup
      supabase.realtime.disconnect();
      setIsConnected(false);
    };
  }, [session]);

  // Subscribe to a channel
  const subscribe = (channelName: string, tableName: string, callback: (payload: any) => void): RealtimeChannel => {
    // If channel already exists, return it
    if (channels[channelName]) {
      return channels[channelName];
    }

    // Create new channel
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, callback)
      .subscribe();

    // Add to channels state
    setChannels((prev) => ({ ...prev, [channelName]: channel }));
    
    return channel;
  };

  // Unsubscribe from a channel
  const unsubscribe = (channelName: string) => {
    if (channels[channelName]) {
      channels[channelName].unsubscribe();
      setChannels((prev) => {
        const newChannels = { ...prev };
        delete newChannels[channelName];
        return newChannels;
      });
    }
  };

  return (
    <RealtimeContext.Provider value={{ isConnected, channels, subscribe, unsubscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};
