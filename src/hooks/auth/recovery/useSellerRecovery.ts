
/**
 * Created: 2025-08-25
 * Hook for diagnosing and repairing seller registration issues
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { SellerRecoveryService, SellerDiagnosisResult } from '@/services/supabase/sellers/sellerRecoveryService';

export function useSellerRecovery() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SellerDiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recoveryService = new SellerRecoveryService();
  
  const runDiagnosis = useCallback(async () => {
    if (!session) {
      setError('No active session');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const diagnosisResult = await recoveryService.diagnoseSellerStatus(session);
      setResult(diagnosisResult);
      
      if (!diagnosisResult.success) {
        setError(diagnosisResult.error || 'Diagnosis failed');
      }
      
      return diagnosisResult;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred during diagnosis';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, recoveryService]);
  
  const repairRegistration = useCallback(async () => {
    if (!session) {
      setError('No active session');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const repairResult = await recoveryService.repairSellerStatus(session);
      setResult(repairResult);
      
      if (!repairResult.success) {
        setError(repairResult.error || 'Repair failed');
      }
      
      return repairResult;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred during repair';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, recoveryService]);
  
  return {
    isLoading,
    error,
    diagnosis: result,
    runDiagnosis,
    repairRegistration
  };
}
