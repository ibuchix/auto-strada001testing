
/**
 * Changes made:
 * - 2025-05-25: Implemented proper routing setup with BrowserRouter
 * - 2025-05-25: Added IndexPage as the default route
 * - 2025-05-25: Kept storage diagnostic available only in development mode
 * - 2025-06-22: Fixed Router placement to work with AuthProvider
 * - 2025-06-22: Removed BrowserRouter as it's now in main.tsx
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { clearStaleLocalStorage } from './config/storage';
import { StorageDiagnostic } from './components/diagnostics/StorageDiagnostic';
import IndexPage from './pages/Index';

function App() {
  useEffect(() => {
    // Clear any stale local storage references on app initialization
    clearStaleLocalStorage();
  }, []);

  return (
    <>
      {/* Show storage diagnostic tool in development environment */}
      {import.meta.env.DEV && <StorageDiagnostic />}
      
      <Routes>
        <Route path="/" element={<IndexPage />} />
        {/* Add more routes here as needed */}
      </Routes>
    </>
  );
}

export default App;
