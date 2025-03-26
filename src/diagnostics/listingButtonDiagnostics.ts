
/**
 * Changes made:
 * - 2024-08-04: Created diagnostic utilities for form submission tracking
 */

import { v4 as uuidv4 } from 'uuid';

// Types
type DiagnosticLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

interface DiagnosticLog {
  id: string;
  timestamp: string;
  event: string;
  message: string;
  details: any;
  level: DiagnosticLevel;
  diagnosticId: string;
}

// In-memory store for diagnostics
const diagnosticStore: Map<string, DiagnosticLog[]> = new Map();

// Generate a new diagnostic session ID
export const generateDiagnosticId = (): string => {
  return uuidv4();
};

// Log a diagnostic event
export const logDiagnostic = (
  event: string,
  message: string,
  details: any = null,
  diagnosticId: string,
  level: DiagnosticLevel = 'INFO'
): void => {
  if (!diagnosticId) {
    console.warn('Diagnostic ID is required for logging');
    return;
  }

  const log: DiagnosticLog = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    event,
    message,
    details,
    level,
    diagnosticId
  };

  // Store in memory
  const existingLogs = diagnosticStore.get(diagnosticId) || [];
  diagnosticStore.set(diagnosticId, [...existingLogs, log]);

  // Also log to console for development
  console.log(`[DIAGNOSTIC] [${level}] ${event}: ${message}`, details);
};

// Get all diagnostics for a specific ID
export const getDiagnostics = (diagnosticId?: string): DiagnosticLog[] => {
  if (!diagnosticId) {
    return [];
  }
  
  return diagnosticStore.get(diagnosticId) || [];
};

// Also alias as getDiagnosticLogs for compatibility
export const getDiagnosticLogs = getDiagnostics;

// Clear diagnostics for a specific ID
export const clearDiagnostics = (diagnosticId: string): void => {
  diagnosticStore.delete(diagnosticId);
};

// Export utility functions for form diagnostics
export const formDiagnostics = {
  trackFormLoad: (formId: string, diagnosticId: string, metadata: any = {}) => {
    logDiagnostic('FORM_LOAD', `Form ${formId} loaded`, metadata, diagnosticId);
  },
  
  trackFormSubmit: (formId: string, diagnosticId: string, metadata: any = {}) => {
    logDiagnostic('FORM_SUBMIT', `Form ${formId} submitted`, metadata, diagnosticId);
  },
  
  trackFormError: (formId: string, error: any, diagnosticId: string) => {
    logDiagnostic('FORM_ERROR', `Error in form ${formId}`, error, diagnosticId, 'ERROR');
  },
  
  trackFormSuccess: (formId: string, result: any, diagnosticId: string) => {
    logDiagnostic('FORM_SUCCESS', `Form ${formId} submitted successfully`, result, diagnosticId);
  }
};
