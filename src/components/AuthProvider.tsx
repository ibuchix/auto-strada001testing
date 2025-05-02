
/**
 * Changes made:
 * - 2024-07-06: Enhanced session management with seller-specific checks
 * - 2024-07-06: Fixed supabase client initialization issue
 * - 2024-08-25: Refactored to properly use the updated useSellerSession hook
 * - 2024-08-25: Added refreshSellerStatus to context for re-checking seller status
 * - 2024-10-15: Added offline mode awareness
 * - 2024-11-16: Updated to work with Row Level Security policies
 * - 2025-07-14: Enhanced metadata-based seller detection without verification
 * - 2025-07-21: Improved seller detection reliability and added additional logging
 * - 2025-04-29: Added signOut function to context
 * - 2025-05-02: Enhanced session persistence and token management
 * - 2025-05-06: Fixed infinite loop issues and improved session recovery reliability
 */

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useSellerSession } from "@/hooks/useSellerSession";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { getFromCache, saveToCache } from "@/services/offlineCacheService";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isSeller: boolean;
  isOffline: boolean;
  refreshSellerStatus: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  isSeller: false,
  isOffline: false,
  refreshSellerStatus: async () => false,
  signOut: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Use the refactored hook directly in the provider
  const { session, isLoading, isSeller, refreshSellerStatus } = useSellerSession();
  const { isOffline } = useOfflineStatus();
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionWarningShown, setSessionWarningShown] = useLocalStorage<boolean>('session-warning-shown', false);
  
  // Handle user activity tracking for session refresh
  useEffect(() => {
    const updateActivity = () => setLastActivity(new Date());
    
    // Set up activity listeners
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    return () => {
      // Clean up listeners
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);
  
  // Setup token refresh based on session expiration
  useEffect(() => {
    // Clear any existing interval when session changes
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
      tokenRefreshIntervalRef.current = null;
    }
    
    // Skip if no session
    if (!session) {
      return;
    }
    
    // Create a token refresh interval that runs every 5 minutes
    const interval = setInterval(async () => {
      try {
        // Check when the token expires
        const expiresAt = new Date((session.expires_at || 0) * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // If token expires in less than 15 minutes and user was recently active, refresh it
        if (timeUntilExpiry <= 15 * 60 * 1000) {
          const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
          
          // Only refresh if user was active in last 30 minutes
          if (timeSinceLastActivity < 30 * 60 * 1000) {
            console.log('AuthProvider: Token expiring soon. Refreshing...');
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.error('Failed to refresh token:', error);
              
              // Only show warning once
              if (!sessionWarningShown) {
                toast.warning('Your session will expire soon', {
                  description: 'You may need to sign in again to continue.',
                  duration: 10000
                });
                setSessionWarningShown(true);
              }
            } else {
              console.log('Token refreshed successfully');
              // Reset warning flag after successful refresh
              if (sessionWarningShown) {
                setSessionWarningShown(false);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error during token refresh check:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    tokenRefreshIntervalRef.current = interval;
    
    // Clean up interval on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session, lastActivity, sessionWarningShown, setSessionWarningShown]);
  
  // Handle sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out", { 
        description: error?.message || "An unexpected error occurred" 
      });
    }
  };
  
  // Debug the auth state to help with troubleshooting
  useEffect(() => {
    if (session) {
      const hasSellerMetadata = !!session.user?.user_metadata?.role && 
                               session.user.user_metadata.role === 'seller';
      
      console.log('AuthProvider: Session status', { 
        isLoading, 
        isSeller, 
        hasSellerMetadata,
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: session.expires_at ? new Date((session.expires_at) * 1000).toLocaleString() : 'unknown'
      });
    }
  }, [session, isLoading, isSeller]);
  
  // Cache the session when it changes (for offline use)
  useEffect(() => {
    if (session && !isOffline) {
      // Always indicate seller role in cache if metadata says so
      const hasSellerMetadata = !!session.user?.user_metadata?.role && 
                              session.user.user_metadata.role === 'seller';
      
      const role = hasSellerMetadata || isSeller ? 'seller' : 'buyer';
      
      console.log('AuthProvider: Caching session with role:', role);
      
      saveToCache('userSession', {
        userId: session.user.id,
        email: session.user.email,
        role: role
      });
    }
  }, [session, isSeller, isOffline]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider 
        value={{ 
          session, 
          isLoading, 
          isSeller,
          isOffline,
          refreshSellerStatus,
          signOut
        }}
      >
        {children}
      </AuthContext.Provider>
    </SessionContextProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
