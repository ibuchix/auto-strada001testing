
/**
 * Upload Debugger Utility
 * Created: 2025-05-21
 * 
 * This utility helps diagnose upload issues by checking the state
 * of temporary upload storage and session management.
 */

export const checkUploadState = (): {
  hasTempSessionId: boolean;
  hasTempUploads: boolean;
  tempUploadCount: number;
  uploadSessionId?: string;
  uploadDetails?: any[];
} => {
  try {
    const sessionId = localStorage.getItem('tempSessionId');
    const tempUploadsStr = localStorage.getItem('tempFileUploads');
    let tempUploads = [];
    let uploadCount = 0;
    
    if (tempUploadsStr) {
      try {
        tempUploads = JSON.parse(tempUploadsStr);
        uploadCount = tempUploads.length;
      } catch (e) {
        console.error('Error parsing temp uploads:', e);
      }
    }
    
    return {
      hasTempSessionId: !!sessionId,
      hasTempUploads: !!tempUploadsStr,
      tempUploadCount: uploadCount,
      uploadSessionId: sessionId || undefined,
      uploadDetails: tempUploads.length > 0 ? tempUploads : undefined
    };
  } catch (e) {
    console.error('Error checking upload state:', e);
    return {
      hasTempSessionId: false,
      hasTempUploads: false,
      tempUploadCount: 0
    };
  }
};

export const clearUploadState = (): void => {
  try {
    localStorage.removeItem('tempSessionId');
    localStorage.removeItem('tempFileUploads');
    console.log('Upload state cleared successfully');
  } catch (e) {
    console.error('Error clearing upload state:', e);
  }
};

export const debugUploadState = (): void => {
  const state = checkUploadState();
  
  console.group('🔍 Upload Debug Information');
  console.log('Temp Session ID exists:', state.hasTempSessionId);
  if (state.uploadSessionId) {
    console.log('Session ID:', state.uploadSessionId);
  }
  
  console.log('Temp Uploads exist:', state.hasTempUploads);
  console.log('Temp Upload count:', state.tempUploadCount);
  
  if (state.uploadDetails && state.uploadDetails.length > 0) {
    console.log('Upload Details:');
    state.uploadDetails.forEach((upload, index) => {
      console.log(`${index + 1}. Category: ${upload.category}, Path: ${upload.filePath}`);
    });
  }
  
  console.groupEnd();
};

export default {
  checkUploadState,
  clearUploadState,
  debugUploadState
};
