
/**
 * Changes made:
 * - 2024-08-16: Added ErrorProvider for centralized error handling
 * - 2025-04-05: Updated to use new error handling system
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/AuthProvider';
import { RealtimeProvider } from './components/RealtimeProvider';
import { TransactionProvider } from './components/transaction/TransactionProvider';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="autostrada-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RealtimeProvider>
              <TransactionProvider>
                <App />
              </TransactionProvider>
            </RealtimeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
