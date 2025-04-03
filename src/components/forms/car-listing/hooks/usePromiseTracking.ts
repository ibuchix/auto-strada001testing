
/**
 * Promise Tracking Hook
 * Tracks the status of promises to help with debugging
 * Created: 2025-04-05
 */

import { useState, useRef, useCallback } from "react";

interface PromiseTrackRecord {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'resolved' | 'rejected';
  error?: any;
}

export const usePromiseTracking = (trackerName: string = 'default') => {
  const [promises, setPromises] = useState<Record<string, PromiseTrackRecord>>({});
  const instanceId = useRef(Math.random().toString(36).substring(2, 8)).current;
  
  // Track a promise
  const trackPromise = useCallback(<T>(
    promiseFunc: () => Promise<T>,
    name: string
  ): Promise<T> => {
    const id = Math.random().toString(36).substring(2, 10);
    const startTime = performance.now();
    
    // Create tracking record
    const trackRecord: PromiseTrackRecord = {
      id,
      name,
      startTime,
      status: 'pending'
    };
    
    console.log(`[PromiseTracker][${instanceId}][${trackerName}] Starting "${name}" (${id})`, {
      timestamp: new Date().toISOString()
    });
    
    // Update state with new promise record
    setPromises(prev => ({
      ...prev,
      [id]: trackRecord
    }));
    
    // Execute the promise
    return promiseFunc()
      .then(result => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Update record on resolution
        setPromises(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            endTime,
            status: 'resolved'
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
        
        // Update record on rejection
        setPromises(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            endTime,
            status: 'rejected',
            error
          }
        }));
        
        console.error(`[PromiseTracker][${instanceId}][${trackerName}] Rejected "${name}" (${id}) in ${duration.toFixed(2)}ms:`, {
          error,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      });
  }, [instanceId, trackerName]);
  
  // Get all pending promises
  const getPendingPromises = useCallback(() => {
    return Object.values(promises).filter(p => p.status === 'pending');
  }, [promises]);
  
  // Get all completed promises (resolved or rejected)
  const getCompletedPromises = useCallback(() => {
    return Object.values(promises).filter(p => p.status !== 'pending');
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
    clearCompletedPromises,
    hasPendingPromises: Object.values(promises).some(p => p.status === 'pending')
  };
};
