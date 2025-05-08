
/**
 * Changes made:
 * - 2024-08-16: Added ErrorProvider for centralized error handling
 * - 2025-04-05: Updated to use new error handling system
 * - 2025-05-05: Fixed structure to ensure proper routing and provider nesting
 * - 2025-04-29: Fixed provider nesting order to prevent rendering issues
 * - 2025-05-01: Fixed React.StrictMode implementation for consistent rendering
 * - 2025-05-08: Added SessionContextProvider for Supabase authentication
 * - 2025-05-08: Removed duplicate BrowserRouter to fix router nesting error
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ui/theme-provider';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './integrations/supabase/client';
import App from './App';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Ensure we have the root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found! Make sure there is a <div id="root"></div> in your HTML!');
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="light" storageKey="autostrada-theme">
        <SessionContextProvider supabaseClient={supabase}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </SessionContextProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
