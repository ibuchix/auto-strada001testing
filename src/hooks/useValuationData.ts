
/**
 * Hook for accessing valuation data
 * Created: 2025-05-24 - Added to support valuation data access in form components
 */

import { useState, useEffect } from 'react';

export const useValuationData = () => {
  const [valuationData, setValuationData] = useState<any>(null);

  // Load valuation data from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('valuationData');
      if (storedData) {
        setValuationData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error loading valuation data:', error);
    }
  }, []);

  // Function to get the current valuation data
  const getValuationData = () => valuationData;
  
  // Function to clear valuation data
  const clearValuationData = () => {
    localStorage.removeItem('valuationData');
    setValuationData(null);
  };

  return {
    valuationData,
    getValuationData,
    clearValuationData
  };
};
