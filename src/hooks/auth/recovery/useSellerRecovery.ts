
/**
 * Updated: 2024-09-08
 * Fixed method names and error handling in useSellerRecovery hook
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { SellerRecoveryService, SellerDiagnosisResult, sellerRecoveryService } from '@/services/supabase/sellers/sellerRecoveryService';

export function useSellerRecovery() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<SellerDiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const runDiagnosis = useCallback(async () => {
    if (!session) {
      setError('No active session');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const diagnosisResult = await sellerRecoveryService.diagnoseSellerStatus(session);
      setDiagnosis(diagnosisResult);
      
      if (!diagnosisResult.success) {
        setError(diagnosisResult.message || 'Diagnosis failed');
      }
      
      return diagnosisResult;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred during diagnosis';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  const repairRegistration = useCallback(async () => {
    if (!session) {
      setError('No active session');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const repairResult = await sellerRecoveryService.repairSellerStatus(session);
      setDiagnosis(repairResult);
      
      if (!repairResult.success) {
        setError(repairResult.message || 'Repair failed');
      }
      
      return repairResult;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred during repair';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  return {
    isLoading,
    error,
    diagnosis,
    runDiagnosis,
    repairRegistration
  };
}
