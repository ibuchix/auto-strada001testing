
/**
 * RimPhotosSection component
 * Created: 2025-05-04
 * Updated: 2025-08-28 - Fixed type compatibility with PhotoUploaderProps
 * Updated: 2025-08-28 - Improved design consistency with main photo section
 * Updated: 2025-05-19 - Fixed React hooks related issues causing error #310
 * Updated: 2025-05-20 - Implemented proper state management and upload handling
 * Updated: 2025-05-21 - Fixed rim photo upload functionality and error handling
 * Updated: 2025-05-29 - Fixed form object passing to photo helper functions
 * Updated: 2025-05-30 - Implemented improved error handling and type safety
 * Updated: 2025-05-30 - Refactored into smaller components for better maintainability
 */

import React from 'react';
import { SafeFormWrapper } from './SafeFormWrapper';
import { RimPhotoContainer } from './rim-photos/RimPhotoContainer';
import { useRimPhotoState } from './rim-photos/useRimPhotoState';

export const RimPhotosSection = () => {
  return (
    <SafeFormWrapper>
      {(form) => {
        // Use the custom hook to manage rim photo state
        const [state, handlers] = useRimPhotoState(form);
        
        return <RimPhotoContainer state={state} handlers={handlers} />;
      }}
    </SafeFormWrapper>
  );
};
