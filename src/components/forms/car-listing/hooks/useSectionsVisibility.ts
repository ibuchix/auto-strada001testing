
/**
 * Hook to manage visibility of form sections
 * Created: 2025-07-23
 * Updated: 2025-05-26 - Fixed field names to use camelCase consistently
 */

import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

export function useSectionsVisibility() {
  const { control } = useFormContext<CarListingFormData>();
  const [visibleSections, setVisibleSections] = useState<string[]>([
    'basicInfo',
    'vehicleDetails',
    'pricing',
    'vehicleStatus',
    'features',
    'additionalInfo',
    'photos'
  ]);

  // Watch form fields that might trigger section visibility changes
  const isDamaged = useWatch({
    control,
    name: 'isDamaged',
    defaultValue: false
  });

  const hasOutstandingFinance = useWatch({
    control,
    name: 'hasOutstandingFinance',
    defaultValue: false
  });

  const hasServiceHistory = useWatch({
    control,
    name: 'hasServiceHistory',
    defaultValue: false
  });

  // Update visible sections based on form values
  useEffect(() => {
    const sections = [
      'basicInfo',
      'vehicleDetails',
      'pricing',
      'vehicleStatus',
      'features',
      'additionalInfo',
      'photos'
    ];

    // Show damage section when car is damaged
    if (isDamaged) {
      sections.push('damage');
    }

    // Show finance details when outstanding finance exists
    if (hasOutstandingFinance) {
      sections.push('financeDetails');
    }

    // Show service history section when it exists
    if (hasServiceHistory) {
      sections.push('serviceHistory');
    }

    setVisibleSections(sections);
  }, [isDamaged, hasOutstandingFinance, hasServiceHistory]);

  // Helper to check if a section should be visible
  const isSectionVisible = (sectionName: string) => {
    // For section objects that have a name property
    if (typeof sectionName === 'object' && sectionName !== null && 'name' in sectionName) {
      return visibleSections.includes(sectionName.name as string);
    }
    // For direct string names
    return visibleSections.includes(sectionName);
  };

  return {
    visibleSections,
    isSectionVisible
  };
}
