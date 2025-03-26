
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from "./components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { RealtimeProvider } from './components/RealtimeProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="autostrada-theme">
        <Toaster />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
