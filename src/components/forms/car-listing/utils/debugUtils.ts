
/**
 * Changes made:
 * - 2024-07-28: Created debug utility to help diagnose data issues
 */

import { CACHE_KEYS, getFromCache } from "@/services/offlineCacheService";

export const debugMileageData = () => {
  const results: Record<string, any> = {};
  
  // Check localStorage directly
  try {
    results.tempMileage = {
      value: localStorage.getItem('tempMileage'),
      source: 'localStorage.tempMileage',
      parsed: localStorage.getItem('tempMileage') ? Number(localStorage.getItem('tempMileage')) : null
    };
  } catch (e) {
    results.tempMileage = { error: e };
  }
  
  // Check valuation data
  try {
    const valuationDataStr = localStorage.getItem('valuationData');
    if (valuationDataStr) {
      const valuationData = JSON.parse(valuationDataStr);
      results.valuationDataMileage = {
        value: valuationData.mileage,
        source: 'localStorage.valuationData.mileage',
        parsed: valuationData.mileage !== undefined ? Number(valuationData.mileage) : null
      };
    } else {
      results.valuationDataMileage = { value: null, source: 'localStorage.valuationData', reason: 'not found' };
    }
  } catch (e) {
    results.valuationDataMileage = { error: e };
  }
  
  // Check cache service data
  try {
    results.cacheFormProgress = {
      source: 'cacheService.FORM_PROGRESS',
      value: getFromCache(CACHE_KEYS.FORM_PROGRESS) 
    };
    
    results.cacheValuationData = {
      source: 'cacheService.VALUATION_DATA',
      value: getFromCache(CACHE_KEYS.VALUATION_DATA)
    };
    
    const cacheValuationData = getFromCache(CACHE_KEYS.VALUATION_DATA);
    if (cacheValuationData && typeof cacheValuationData === 'object' && 'mileage' in cacheValuationData) {
      results.cacheValuationDataMileage = {
        value: cacheValuationData.mileage,
        source: 'cacheService.VALUATION_DATA.mileage',
        parsed: Number(cacheValuationData.mileage)
      };
    }
  } catch (e) {
    results.cacheData = { error: e };
  }
  
  // Check URL state
  try {
    if (window.history.state?.usr?.valuationData) {
      results.urlStateMileage = {
        value: window.history.state.usr.valuationData.mileage,
        source: 'window.history.state.usr.valuationData.mileage',
        parsed: Number(window.history.state.usr.valuationData.mileage)
      };
    } else {
      results.urlStateMileage = { value: null, source: 'window.history.state', reason: 'not found' };
    }
  } catch (e) {
    results.urlStateMileage = { error: e };
  }
  
  console.table(results);
  return results;
};

export const logAllLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      storage[key] = localStorage.getItem(key) || '';
    }
  }
  
  console.log('All localStorage items:', storage);
  return storage;
};
