
/**
 * Changes made:
 * - 2025-05-25: Implemented proper routing setup with BrowserRouter
 * - 2025-05-25: Added IndexPage as the default route
 * - 2025-05-25: Kept storage diagnostic available only in development mode
 * - 2025-06-22: Fixed Router placement to work with AuthProvider
 * - 2025-06-22: Removed BrowserRouter as it's now in main.tsx
 * - 2025-06-22: Completely removed StorageDiagnostic from homepage
 * - 2025-06-22: Added dedicated diagnostics page only in development
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { clearStaleLocalStorage } from './config/storage';
import IndexPage from './pages/Index';

// Only import the diagnostic page in development mode
const DiagnosticsPage = import.meta.env.DEV 
  ? lazy(() => import('./pages/Diagnostics'))
  : () => null;

import { lazy, Suspense } from 'react';

function App() {
  useEffect(() => {
    // Clear any stale local storage references on app initialization
    clearStaleLocalStorage();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        
        {/* Conditionally render diagnostics route only in development */}
        {import.meta.env.DEV && (
          <Route 
            path="/diagnostics" 
            element={
              <Suspense fallback={<div>Loading diagnostics...</div>}>
                <DiagnosticsPage />
              </Suspense>
            } 
          />
        )}
        
        {/* Add more routes here as needed */}
      </Routes>
    </>
  );
}

export default App;
