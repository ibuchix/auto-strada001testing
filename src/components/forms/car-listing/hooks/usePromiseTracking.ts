
/**
 * Promise Tracking Hook
 * Tracks the status of promises to help with debugging
 * Created: 2025-04-05
 * Updated: 2025-04-06 - Enhanced with better timeout handling and error recovery
 * Updated: 2025-04-07 - Added error severity classification and recovery options
 */

import { useState, useRef, useCallback } from "react";
import { TimeoutDurations } from "@/utils/timeoutUtils";

interface PromiseTrackRecord {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'resolved' | 'rejected';
  error?: any;
  duration?: number;
  severity?: 'critical' | 'warning' | 'info';
  recoverable?: boolean;
}

export const usePromiseTracking = (trackerName: string = 'default') => {
  const [promises, setPromises] = useState<Record<string, PromiseTrackRecord>>({});
  const instanceId = useRef(Math.random().toString(36).substring(2, 8)).current;
  
  // Clean up old promises automatically to prevent memory leaks
  const cleanupOldPromises = useCallback(() => {
    const now = performance.now();
    const CLEANUP_THRESHOLD = 60000; // 60 seconds
    
    setPromises(prev => {
      const newPromises = { ...prev };
      let cleanedCount = 0;
      
      Object.entries(newPromises).forEach(([id, promise]) => {
        // Remove completed promises older than threshold
        if (promise.endTime && (now - promise.endTime > CLEANUP_THRESHOLD)) {
          delete newPromises[id];
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`[PromiseTracker][${instanceId}][${trackerName}] Cleaned up ${cleanedCount} old promises`);
      }
      
      return newPromises;
    });
  }, [instanceId, trackerName]);
  
  // Track a promise with timeout protection and error classification
  const trackPromise = useCallback(<T>(
    promiseFunc: () => Promise<T>,
    name: string,
    options: {
      timeoutMs?: number;
      isCritical?: boolean;
      retryOnError?: boolean;
      fallbackValue?: T;
    } = {}
  ): Promise<T> => {
    const {
      timeoutMs = TimeoutDurations.MEDIUM,
      isCritical = true,
      retryOnError = false,
      fallbackValue
    } = options;
    
    const id = Math.random().toString(36).substring(2, 10);
    const startTime = performance.now();
    
    // Create tracking record
    const trackRecord: PromiseTrackRecord = {
      id,
      name,
      startTime,
      status: 'pending',
      severity: isCritical ? 'critical' : 'warning',
      recoverable: !isCritical || retryOnError
    };
    
    console.log(`[PromiseTracker][${instanceId}][${trackerName}] Starting "${name}" (${id})`, {
      timestamp: new Date().toISOString(),
      isCritical,
      fallbackAvailable: fallbackValue !== undefined
    });
    
    // Update state with new promise record
    setPromises(prev => ({
      ...prev,
      [id]: trackRecord
    }));
    
    // Clean up old promises
    cleanupOldPromises();
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error(`Promise "${name}" timed out after ${timeoutMs}ms`);
        reject(timeoutError);
      }, timeoutMs);
    });
    
    // Execute the promise with timeout protection
    return Promise.race([
      promiseFunc(),
      timeoutPromise
    ])
      .then(result => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Update record on resolution
        setPromises(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            endTime,
            status: 'resolved',
            duration
          }
        }));
        
        console.log(`[PromiseTracker][${instanceId}][${trackerName}] Resolved "${name}" (${id}) in ${duration.toFixed(2)}ms`, {
          timestamp: new Date().toISOString()
        });
        
        return result;
      })
      .catch(error => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Determine if this was a timeout error
        const isTimeoutError = error.message && error.message.includes('timed out after');
        const severity = isCritical ? 'critical' : 'warning';
        
        // Update record on rejection
        setPromises(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            endTime,
            status: 'rejected',
            error,
            duration,
            severity
          }
        }));
        
        // Special handling for timeout errors
        if (isTimeoutError) {
          console.error(`[PromiseTracker][${instanceId}][${trackerName}] TIMEOUT "${name}" (${id}) after ${duration.toFixed(2)}ms:`, {
            error,
            severity,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error(`[PromiseTracker][${instanceId}][${trackerName}] Rejected "${name}" (${id}) in ${duration.toFixed(2)}ms:`, {
            error,
            severity,
            timestamp: new Date().toISOString()
          });
        }
        
        // Return fallback value if available and error is non-critical
        if (!isCritical && fallbackValue !== undefined) {
          console.log(`[PromiseTracker][${instanceId}][${trackerName}] Using fallback value for "${name}" (${id})`);
          return fallbackValue;
        }
        
        throw error;
      });
  }, [instanceId, trackerName, cleanupOldPromises]);
  
  // Get all pending promises
  const getPendingPromises = useCallback(() => {
    return Object.values(promises).filter(p => p.status === 'pending');
  }, [promises]);
  
  // Get all completed promises (resolved or rejected)
  const getCompletedPromises = useCallback(() => {
    return Object.values(promises).filter(p => p.status !== 'pending');
  }, [promises]);
  
  // Get all failed promises
  const getFailedPromises = useCallback(() => {
    return Object.values(promises).filter(p => p.status === 'rejected');
  }, [promises]);
  
  // Get critical failures only
  const getCriticalFailures = useCallback(() => {
    return Object.values(promises).filter(p => 
      p.status === 'rejected' && p.severity === 'critical'
    );
  }, [promises]);
  
  // Clear completed promises from tracking
  const clearCompletedPromises = useCallback(() => {
    setPromises(prev => {
      const newPromises = { ...prev };
      Object.entries(newPromises).forEach(([id, promise]) => {
        if (promise.status !== 'pending') {
          delete newPromises[id];
        }
      });
      return newPromises;
    });
  }, []);

  return {
    trackPromise,
    promises,
    getPendingPromises,
    getCompletedPromises,
    getFailedPromises,
    getCriticalFailures,
    clearCompletedPromises,
    hasPendingPromises: Object.values(promises).some(p => p.status === 'pending'),
    hasFailedPromises: Object.values(promises).some(p => p.status === 'rejected'),
    hasCriticalFailures: Object.values(promises).some(p => 
      p.status === 'rejected' && p.severity === 'critical' && !p.recoverable
    )
  };
};
