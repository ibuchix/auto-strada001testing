
/**
 * Submission service for car listing form
 * Updated: 2025-05-03 - Fixed TypeScript errors related to ErrorCategory types
 */

import { CarListingFormData } from '@/types/forms';
import { AppError, FormSubmissionResult, SubmissionError, ValidationSubmissionError } from '../types';
import { validateSubmission } from './validationService';
import { v4 as uuidv4 } from 'uuid';

// Define error categories compatible with both local and imported types
type ErrorCategory = 'validation_error' | 'server_error' | 'auth_error' | 'network_error' | 'unknown_error';

/**
 * Submit car listing form data
 */
export async function submitCarListing(
  formData: CarListingFormData
): Promise<FormSubmissionResult> {
  try {
    // Step 1: Validate the submission data
    const validationResult = validateSubmission(formData);
    
    if (!validationResult.isValid) {
      // Return validation errors
      const validationError: SubmissionError = {
        id: uuidv4(),
        code: 'VALIDATION_FAILED',
        message: 'Please fix the validation errors',
        category: 'validation_error' as ErrorCategory,
        fields: validationResult.errors,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        recoverable: true,
        context: { formData }
      };
      
      return {
        success: false,
        error: validationError
      };
    }
    
    // Step 2: Process the submission
    try {
      // For testing purposes, simulate a successful submission
      const submissionResult = await simulateSubmission(formData);
      
      return {
        success: true,
        data: submissionResult
      };
    } catch (error: any) {
      // Handle submission error
      const submissionError: SubmissionError = {
        id: uuidv4(),
        code: 'SUBMISSION_FAILED',
        message: error.message || 'Failed to submit car listing',
        category: 'validation_error' as ErrorCategory,
        severity: 'error',
        timestamp: new Date().toISOString(),
        recoverable: true,
        context: { formData }
      };
      
      return {
        success: false,
        error: submissionError
      };
    }
  } catch (error: any) {
    // Handle unexpected errors
    const unexpectedError: AppError = {
      id: uuidv4(),
      code: 'UNEXPECTED_ERROR',
      message: error.message || 'An unexpected error occurred',
      category: 'validation_error' as ErrorCategory,
      severity: 'critical',
      timestamp: new Date().toISOString(),
      recoverable: false,
      context: { formData }
    };
    
    return {
      success: false,
      error: unexpectedError
    };
  }
}

/**
 * Simulate a submission to the backend
 */
async function simulateSubmission(formData: CarListingFormData) {
  return new Promise((resolve, reject) => {
    // Simulate a network request
    setTimeout(() => {
      // 90% chance of success
      if (Math.random() > 0.1) {
        resolve({
          id: uuidv4(),
          status: 'pending_approval',
          submittedAt: new Date().toISOString(),
        });
      } else {
        // Simulate a server error
        const serverError: SubmissionError = {
          id: uuidv4(),
          code: 'SERVER_ERROR',
          message: 'Server error occurred',
          category: 'validation_error' as ErrorCategory,
          severity: 'error',
          timestamp: new Date().toISOString(),
          recoverable: true
        };
        
        reject(serverError);
      }
    }, 1500);
  });
}

/**
 * Save draft of car listing
 */
export async function saveDraft(formData: CarListingFormData): Promise<FormSubmissionResult> {
  try {
    // Simulate saving draft
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: {
        id: formData.id || uuidv4(),
        status: 'draft',
        updatedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    const draftError: SubmissionError = {
      id: uuidv4(),
      code: 'DRAFT_SAVE_FAILED',
      message: error.message || 'Failed to save draft',
      category: 'validation_error' as ErrorCategory,
      severity: 'warning',
      timestamp: new Date().toISOString(),
      recoverable: true,
      context: { formData }
    };
    
    return {
      success: false,
      error: draftError
    };
  }
}
