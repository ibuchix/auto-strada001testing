
/**
 * Idempotency Utilities
 * 
 * Provides functions for generating and managing idempotency keys
 * to prevent duplicate form submissions and API calls.
 */

import { v4 as uuidv4 } from 'uuid';

// Storage keys
const IDEMPOTENCY_STORAGE_PREFIX = 'idempotency_';
const IDEMPOTENCY_USED_PREFIX = 'idempotency_used_';

/**
 * Generates a new idempotency key for a specific operation
 * 
 * @param operationType - Type of operation (e.g., 'car_submission', 'payment')
 * @param entityId - Optional ID of the entity being processed
 * @returns The generated idempotency key
 */
export const generateIdempotencyKey = (operationType: string, entityId?: string): string => {
  const timestamp = Date.now();
  const randomPart = uuidv4().split('-')[0];
  const idempotencyKey = `${operationType}_${timestamp}_${randomPart}${entityId ? `_${entityId}` : ''}`;
  
  // Store the key in localStorage to track it
  storeIdempotencyKey(idempotencyKey, operationType, entityId);
  
  return idempotencyKey;
};

/**
 * Stores an idempotency key in localStorage
 */
const storeIdempotencyKey = (key: string, operationType: string, entityId?: string): void => {
  try {
    const storageKey = `${IDEMPOTENCY_STORAGE_PREFIX}${operationType}`;
    localStorage.setItem(storageKey, key);
    
    // Also store metadata about this key
    const metadata = {
      key,
      operationType,
      entityId,
      createdAt: new Date().toISOString(),
      used: false
    };
    
    localStorage.setItem(`${IDEMPOTENCY_STORAGE_PREFIX}${key}`, JSON.stringify(metadata));
  } catch (e) {
    console.error('Failed to store idempotency key:', e);
  }
};

/**
 * Marks an idempotency key as used
 */
export const markIdempotencyKeyAsUsed = (key: string): void => {
  try {
    const metadataKey = `${IDEMPOTENCY_STORAGE_PREFIX}${key}`;
    const metadataJson = localStorage.getItem(metadataKey);
    
    if (metadataJson) {
      const metadata = JSON.parse(metadataJson);
      metadata.used = true;
      metadata.usedAt = new Date().toISOString();
      
      localStorage.setItem(metadataKey, JSON.stringify(metadata));
      localStorage.setItem(`${IDEMPOTENCY_USED_PREFIX}${key}`, 'true');
    }
  } catch (e) {
    console.error('Failed to mark idempotency key as used:', e);
  }
};

/**
 * Checks if an idempotency key has been used
 */
export const isIdempotencyKeyUsed = (key: string): boolean => {
  try {
    return localStorage.getItem(`${IDEMPOTENCY_USED_PREFIX}${key}`) === 'true';
  } catch (e) {
    console.error('Failed to check if idempotency key is used:', e);
    return false;
  }
};

/**
 * Gets the current idempotency key for an operation type
 */
export const getCurrentIdempotencyKey = (operationType: string): string | null => {
  try {
    const storageKey = `${IDEMPOTENCY_STORAGE_PREFIX}${operationType}`;
    return localStorage.getItem(storageKey);
  } catch (e) {
    console.error('Failed to get current idempotency key:', e);
    return null;
  }
};

/**
 * Cleans up used idempotency keys
 */
export const cleanupIdempotencyKeys = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    // Find all idempotency-related items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(IDEMPOTENCY_STORAGE_PREFIX)) {
        // Check if it's a metadata entry
        if (key.length > IDEMPOTENCY_STORAGE_PREFIX.length + 10) {
          const metadataJson = localStorage.getItem(key);
          if (metadataJson) {
            const metadata = JSON.parse(metadataJson);
            // Remove keys older than 7 days
            const createdAt = new Date(metadata.createdAt).getTime();
            const now = Date.now();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            
            if (now - createdAt > sevenDaysMs) {
              keysToRemove.push(key);
              // Also remove the used marker
              keysToRemove.push(`${IDEMPOTENCY_USED_PREFIX}${metadata.key}`);
            }
          }
        }
      }
    }
    
    // Remove the collected keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
  } catch (e) {
    console.error('Failed to cleanup idempotency keys:', e);
  }
};
