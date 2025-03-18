
/**
 * Changes made:
 * - 2024-08-20: Created utility for common Supabase error handling cases
 */

import { toast } from "sonner";
import { parseSupabaseError } from "./validation";

export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  PERMISSION = "permission",
  VALIDATION = "validation",
  NETWORK = "network",
  GENERAL = "general"
}

export interface ErrorAction {
  label: string;
  onClick: () => void;
}

/**
 * Categorizes a Supabase error into predefined categories
 */
export const categorizeError = (error: any): ErrorCategory => {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('not authenticated') || 
      errorMessage.includes('invalid token') || 
      errorMessage.includes('expired') ||
      error?.code === 401) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  if (errorMessage.includes('permission') || 
      errorMessage.includes('not allowed') ||
      error?.code === '42501' ||
      error?.code === 403) {
    return ErrorCategory.PERMISSION;
  }

  if (errorMessage.includes('validation') || 
      errorMessage.includes('invalid input') ||
      error?.code === '23505' ||
      error?.code === '23503') {
    return ErrorCategory.VALIDATION;
  }
  
  if (errorMessage.includes('network') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      error?.code === 'NETWORK_ERROR') {
    return ErrorCategory.NETWORK;
  }
  
  return ErrorCategory.GENERAL;
};

/**
 * Returns appropriate user actions based on error category
 */
export const getErrorActions = (category: ErrorCategory): ErrorAction | null => {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return {
        label: "Sign In",
        onClick: () => window.location.href = '/auth'
      };
    case ErrorCategory.NETWORK:
      return {
        label: "Try Again",
        onClick: () => window.location.reload()
      };
    default:
      return null;
  }
};

/**
 * Handles common error patterns for Supabase errors
 */
export const handleCommonError = (error: any, contextMessage?: string): string => {
  const errorMessage = parseSupabaseError(error);
  const category = categorizeError(error);
  const action = getErrorActions(category);
  const fullMessage = contextMessage ? `${contextMessage}: ${errorMessage}` : errorMessage;
  
  console.error(`[${category}] Supabase error:`, error);
  
  toast.error(fullMessage, {
    duration: 5000,
    action: action ? {
      label: action.label,
      onClick: action.onClick
    } : undefined
  });
  
  return fullMessage;
};
