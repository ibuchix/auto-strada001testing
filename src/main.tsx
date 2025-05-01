
/**
 * Changes made:
 * - 2024-08-16: Added ErrorProvider for centralized error handling
 * - 2025-04-05: Updated to use new error handling system
 * - 2025-05-05: Fixed structure to ensure proper routing and provider nesting
 * - 2025-04-29: Fixed provider nesting order to prevent rendering issues
 * - 2025-05-01: Fixed React.StrictMode implementation for consistent rendering
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ui/theme-provider';
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
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="autostrada-theme">
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
