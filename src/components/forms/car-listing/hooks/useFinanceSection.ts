
/**
 * Changes made:
 * - Created custom hook for Finance Details section
 * - Encapsulated finance data validation and state management
 * - Implemented document upload and preview functionality
 * - 2025-05-14 - Updated to handle financeAmount as a number instead of string
 * - 2025-05-20 - Updated field names to use snake_case to match database schema
 * - 2025-05-24 - Updated to use camelCase field names consistently for frontend
 */

import { useState, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const useFinanceSection = (form: UseFormReturn<CarListingFormData>) => {
  const [isUploading, setIsUploading] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  
  const hasOutstandingFinance = form.watch("hasOutstandingFinance");
  const financeDocument = form.watch("financeDocument");
  
  // Update preview URL when document changes
  useEffect(() => {
    if (financeDocument && typeof financeDocument === 'string') {
      setDocumentPreviewUrl(financeDocument);
    } else {
      setDocumentPreviewUrl(null);
    }
  }, [financeDocument]);
  
  // Handle finance document upload
  const handleDocumentUpload = useCallback(async (file: File): Promise<boolean> => {
    if (!file) return false;
    
    setIsUploading(true);
    
    try {
      // Validate file
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or image file (JPG, PNG)');
        return false;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size exceeds 5MB limit');
        return false;
      }
      
      // Simulate upload with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create URL for preview if it's an image
      let previewUrl = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
        setDocumentPreviewUrl(previewUrl);
      } else {
        // For PDFs, we could show an icon or thumbnail
        setDocumentPreviewUrl('/pdf-icon.png');
      }
      
      // Update form with document info
      form.setValue('financeDocument', previewUrl || 'document-uploaded', { shouldValidate: true });
      
      toast.success('Finance document uploaded successfully');
      return true;
    } catch (error) {
      console.error('Error uploading finance document:', error);
      toast.error('Failed to upload finance document');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [form]);
  
  // Remove uploaded document
  const removeDocument = useCallback(() => {
    form.setValue('financeDocument', null, { shouldValidate: true });
    setDocumentPreviewUrl(null);
    toast.success('Finance document removed');
  }, [form]);
  
  // Validate finance amount
  const validateFinanceAmount = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined) return true;
    
    // Check if it's a valid number
    if (isNaN(Number(value))) {
      return 'Please enter a valid amount';
    }
    
    // Check if it's positive
    if (Number(value) <= 0) {
      return 'Amount must be greater than zero';
    }
    
    return true;
  }, []);
  
  // Validate the entire finance section
  const validateFinanceSection = useCallback(() => {
    if (!hasOutstandingFinance) return true;
    
    const { financeAmount, financeProvider } = form.getValues();
    let isValid = true;
    
    // Check required fields
    if (financeAmount === null || financeAmount === undefined) {
      form.setError('financeAmount', {
        type: 'required',
        message: 'Please enter the outstanding finance amount'
      });
      isValid = false;
    }
    
    if (!financeProvider) {
      form.setError('financeProvider', {
        type: 'required',
        message: 'Please select your finance provider'
      });
      isValid = false;
    }
    
    if (!isValid) {
      toast.error('Please complete all required finance fields');
    }
    
    return isValid;
  }, [hasOutstandingFinance, form]);
  
  return {
    hasOutstandingFinance,
    documentPreviewUrl,
    isUploading,
    handleDocumentUpload,
    removeDocument,
    validateFinanceAmount,
    validateFinanceSection
  };
};
