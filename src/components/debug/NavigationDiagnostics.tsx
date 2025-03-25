
/**
 * Changes made:
 * - 2027-06-15: Created navigation diagnostics component for monitoring and debugging navigation issues
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const NavigationDiagnostics = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [navState, setNavState] = useState<Record<string, any>>({});
  
  // Only show in development mode and when activated
  useEffect(() => {
    // Check if we should enable the diagnostics
    const shouldEnable = import.meta.env.DEV && 
      (localStorage.getItem('enableNavDiagnostics') === 'true' || 
       new URLSearchParams(window.location.search).get('debug') === 'true');
    
    if (shouldEnable) {
      setIsVisible(true);
      
      // Intercept console logs
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        
        // Only capture navigation and button logs
        const logString = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg).substring(0, 150) + '...' : arg
        ).join(' ');
        
        if (logString.includes('NAVIGATION') || logString.includes('BUTTON') || 
            logString.includes('ValidationHook') || logString.includes('SellMyCar')) {
          setLogs(prev => [logString, ...prev].slice(0, 50)); // Keep the last 50 logs
        }
      };
      
      console.error = function(...args) {
        originalConsoleError.apply(console, args);
        
        const logString = '❌ ERROR: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg).substring(0, 150) + '...' : arg
        ).join(' ');
        
        if (logString.includes('NAVIGATION') || logString.includes('BUTTON') || 
            logString.includes('ValidationHook') || logString.includes('SellMyCar')) {
          setLogs(prev => [logString, ...prev].slice(0, 50));
        }
      };
      
      console.warn = function(...args) {
        originalConsoleWarn.apply(console, args);
        
        const logString = '⚠️ WARNING: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg).substring(0, 150) + '...' : arg
        ).join(' ');
        
        if (logString.includes('NAVIGATION') || logString.includes('BUTTON') || 
            logString.includes('ValidationHook') || logString.includes('SellMyCar')) {
          setLogs(prev => [logString, ...prev].slice(0, 50));
        }
      };
      
      // Collect navigation state info
      updateNavigationState();
      
      // Clean up console overrides
      return () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      };
    }
  }, []);
  
  // Update navigation state whenever location changes
  useEffect(() => {
    if (isVisible) {
      updateNavigationState();
    }
  }, [location, isVisible]);
  
  const updateNavigationState = () => {
    // Gather all relevant navigation data
    const state: Record<string, any> = {
      currentPath: location.pathname,
      currentSearch: location.search,
      hasLocationState: !!location.state,
      locationStateKeys: location.state ? Object.keys(location.state) : [],
      timestamp: new Date().toISOString()
    };
    
    // Add localStorage data
    try {
      const navKeys = [
        'navigationInProgress', 'navigationStartTime', 'lastNavigationAttempt',
        'navigationAttemptCount', 'navigationAttemptId', 'navigationDebugInfo',
        'buttonMountTime', 'lastButtonClickTime', 'validationResult'
      ];
      
      navKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          state[key] = value;
        }
      });
      
      // Try to get valuationData size
      const valuationData = localStorage.getItem('valuationData');
      if (valuationData) {
        state.hasValuationData = true;
        state.valuationDataSize = valuationData.length;
        
        try {
          const parsed = JSON.parse(valuationData);
          state.valuationDataKeys = Object.keys(parsed);
          state.valuationDataHasVin = !!parsed.vin;
        } catch (e) {
          state.valuationDataParseError = true;
        }
      } else {
        state.hasValuationData = false;
      }
      
      // Get VIN info
      const tempVIN = localStorage.getItem('tempVIN');
      if (tempVIN) {
        state.hasTempVIN = true;
        state.tempVINPrefix = tempVIN.substring(0, 4) + '...';
      } else {
        state.hasTempVIN = false;
      }
    } catch (e) {
      state.localStorageError = true;
    }
    
    setNavState(state);
  };
  
  // Hide when not visible
  if (!isVisible) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        width: 400,
        maxHeight: 500,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#00ff00',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: 12,
        padding: 10,
        borderRadius: 5,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontWeight: 'bold' }}>NAVIGATION DIAGNOSTICS</span>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #444', marginBottom: 5 }}>
          Navigation State
        </div>
        <div>
          {Object.entries(navState).map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              fontSize: 11, 
              marginBottom: 3,
              color: key.includes('Error') ? '#ff6666' : '#00ff00'
            }}>
              <span style={{ width: 150, color: '#aaaaff' }}>{key}:</span>
              <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #444', marginBottom: 5 }}>
          Navigation Logs
        </div>
        <div style={{ height: 200, overflowY: 'auto' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ 
              fontSize: 10, 
              marginBottom: 5, 
              color: log.includes('ERROR') ? '#ff6666' : log.includes('WARNING') ? '#ffff00' : '#00ff00',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: 10, fontSize: 10, color: '#aaaaaa', textAlign: 'center' }}>
        Development use only - Navigation Diagnostics {import.meta.env.DEV ? 'Enabled' : 'Disabled'}
      </div>
    </div>
  );
};
