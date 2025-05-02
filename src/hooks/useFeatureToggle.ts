
/**
 * Simple feature toggle hook to control feature flags
 * Created: 2025-06-05 to fix missing import error
 */

import { useState, useEffect } from "react";

export function useFeatureToggle(featureName: string, defaultValue = false): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Check if we have a value in localStorage
    const storedValue = localStorage.getItem(`feature_${featureName}`);
    return storedValue ? storedValue === 'true' : defaultValue;
  });

  useEffect(() => {
    // Listen for feature flag changes (for remote configuration)
    const handleFeatureUpdate = (event: StorageEvent) => {
      if (event.key === `feature_${featureName}`) {
        setIsEnabled(event.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleFeatureUpdate);
    return () => window.removeEventListener('storage', handleFeatureUpdate);
  }, [featureName]);

  return isEnabled;
}
