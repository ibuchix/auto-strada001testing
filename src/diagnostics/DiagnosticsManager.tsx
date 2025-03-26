/**
 * Changes made:
 * - 2028-06-01: Created diagnostics manager component for global app diagnostics
 */

import { useEffect } from 'react';
import { useFormDebugMode, initializeDebugMode } from '@/hooks/useFormDebugMode';

/**
 * Global diagnostics manager for the application
 * Mount this component once at the app root level
 */
export const DiagnosticsManager = () => {
  // Initialize debug mode
  const { isDebugModeEnabled } = useFormDebugMode();
  
  // Set up global error handler
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Enhanced error logging
    console.error = (...args) => {
      // Call original to maintain default behavior
      originalConsoleError.apply(console, args);
      
      // Add enhanced logging in debug mode
      if (isDebugModeEnabled) {
        try {
          // Create stack trace
          const stack = new Error().stack;
          
          // Store in diagnostics localStorage if appropriate
          const errorData = {
            timestamp: new Date().toISOString(),
            type: 'error',
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '),
            stack
          };
          
          // Store recent errors
          const recentErrors = JSON.parse(localStorage.getItem('recentErrors') || '[]');
          recentErrors.push(errorData);
          
          // Keep only most recent 50 errors
          while (recentErrors.length > 50) {
            recentErrors.shift();
          }
          
          localStorage.setItem('recentErrors', JSON.stringify(recentErrors));
        } catch (e) {
          // Don't let diagnostic logging break anything
        }
      }
    };
    
    // Enhanced warning logging
    console.warn = (...args) => {
      // Call original
      originalConsoleWarn.apply(console, args);
      
      // Add enhanced logging in debug mode
      if (isDebugModeEnabled) {
        try {
          // Similar pattern to error logging for warnings
          const warnData = {
            timestamp: new Date().toISOString(),
            type: 'warning',
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')
          };
          
          const recentWarnings = JSON.parse(localStorage.getItem('recentWarnings') || '[]');
          recentWarnings.push(warnData);
          
          while (recentWarnings.length > 50) {
            recentWarnings.shift();
          }
          
          localStorage.setItem('recentWarnings', JSON.stringify(recentWarnings));
        } catch (e) {
          // Don't let diagnostic logging break anything
        }
      }
    };
    
    // Initialize debug mode
    initializeDebugMode();
    
    return () => {
      // Restore original console methods on cleanup
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [isDebugModeEnabled]);
  
  // Add global unhandled error listener
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (isDebugModeEnabled) {
        try {
          const errorData = {
            timestamp: new Date().toISOString(),
            type: 'unhandled_error',
            message: event.message,
            source: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
          };
          
          const unhandledErrors = JSON.parse(localStorage.getItem('unhandledErrors') || '[]');
          unhandledErrors.push(errorData);
          
          while (unhandledErrors.length > 20) {
            unhandledErrors.shift();
          }
          
          localStorage.setItem('unhandledErrors', JSON.stringify(unhandledErrors));
        } catch (e) {
          // Don't let diagnostic logging break anything
        }
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [isDebugModeEnabled]);
  
  return null; // This is a non-visual component
};
