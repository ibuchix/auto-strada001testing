
/**
 * Form Submission Service
 * Updated: 2025-05-04 - Fixed TypeScript errors with AppError and error categories
 */

import { supabase } from '@/integrations/supabase/client';
import { CarListingFormData } from '@/types/forms';
import { validateForm } from './validationService';
import { AppError, FormSubmissionResult, SubmissionError, ValidationSubmissionError } from '../types';

export async function submitCarListing(formData: CarListingFormData): Promise<FormSubmissionResult> {
  try {
    // 1. Validate the form data
    console.log('Starting form validation');
    const validationResult = await validateForm(formData);
    
    if (!validationResult) {
      console.error('Form validation failed');
      
      // Custom error for validation failure
      throw new ValidationSubmissionError(
        'Form validation failed',
        ['Please check your input and try again']
      );
    }
    
    // 2. Process and transform data
    console.log('Preparing submission data');
    const submissionData = prepareSubmissionData(formData);
    
    // 3. Submit to database
    console.log('Submitting to database');
    const { data, error } = await supabase
      .from('cars')
      .upsert([submissionData], {
        onConflict: 'id'
      });
    
    if (error) {
      console.error('Database error:', error);
      throw new SubmissionError(
        `Database error: ${error.message}`,
        'DB_ERROR',
        'technical'
      );
    }
    
    console.log('Submission successful', data);
    return { 
      success: true, 
      data 
    };
    
  } catch (error) {
    console.error('Submission error:', error);
    
    // Handle different types of errors
    if (error instanceof ValidationSubmissionError) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    if (error instanceof SubmissionError) {
      return {
        success: false,
        error: error.message
      };
    }
    
    // Generic error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function prepareSubmissionData(formData: CarListingFormData): any {
  try {
    // Create a copy of the data
    const submissionData = { ...formData };
    
    // Fix boolean fields that might be undefined
    submissionData.is_draft = formData.status === 'draft' ?? true;
    
    // Process special fields
    if (typeof submissionData.features === 'string') {
      try {
        submissionData.features = JSON.parse(submissionData.features);
      } catch (e) {
        console.error('Error parsing features:', e);
        submissionData.features = {};
      }
    }
    
    return submissionData;
  } catch (error) {
    console.error('Error preparing submission data:', error);
    throw new SubmissionError(
      `Failed to prepare submission data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PREP_ERROR',
      'technical'
    );
  }
}
